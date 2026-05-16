import { headers } from 'next/headers';
import { db } from '@/db';
import { rooms, participants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
  });
}

export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    return { success: true }; 
  }
  const { success } = await ratelimit.limit(identifier);
  return { success };
}

export type AuthContext = 
  | { role: 'admin'; roomId: string }
  | { role: 'participant'; roomId: string; participantId: string }
  | null;

export async function getAuthContext(roomId: string): Promise<{ auth: AuthContext; response?: Response }> {
  const headersList = await headers();
  const editKey = headersList.get('x-edit-key');
  const participantKey = headersList.get('x-participant-key');
  const authHeader = headersList.get('authorization');

  // 1. Admin via Edit Key
  if (editKey) {
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
      columns: { id: true, editKey: true }
    });
    if (room && room.editKey === editKey) {
      return { auth: { role: 'admin', roomId } };
    }
  }

  // 2. Participant via Participant Key
  if (participantKey) {
    const participant = await db.query.participants.findFirst({
      where: and(eq(participants.participantKey, participantKey), eq(participants.roomId, roomId)),
      columns: { id: true, roomId: true }
    });
    if (participant) {
      return { auth: { role: 'participant', roomId, participantId: participant.id } };
    }
  }

  // 3. Admin via Basic Auth (Password)
  if (authHeader?.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [, password] = credentials.split(':');
    
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
      columns: { id: true, passwordHash: true }
    });

    if (room && room.passwordHash && password) {
      const isValid = await bcrypt.compare(password, room.passwordHash);
      if (isValid) {
        return { auth: { role: 'admin', roomId } };
      }
    }
  }

  return { auth: null, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
}