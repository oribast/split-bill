import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, participants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, parseBasicAuth } from './auth';
import { getFailedAttempts, incrementFailedAttempts } from './redis';

export async function guardRoom(
  request: Request,
  roomId: string,
  opts?: { requireAdmin?: boolean; allowParticipant?: boolean }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  const failures = await getFailedAttempts(ip, roomId);
  if (failures >= 5) {
    return NextResponse.json({ error: 'Too many attempts', code: 'rate_limited' }, { status: 429 });
  }

  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const editKey = request.headers.get('X-Edit-Key');
  const participantKey = request.headers.get('X-Participant-Key');
  const authHeader = request.headers.get('Authorization');

  let role: 'admin' | 'participant' | 'password' | null = null;

  if (editKey && room.editKey === editKey) {
    role = 'admin';
  } else if (participantKey && opts?.allowParticipant) {
    const p = await db.query.participants.findFirst({
      where: eq(participants.participantKey, participantKey),
    });
    if (p && p.roomId === roomId) role = 'participant';
  } else if (authHeader && room.passwordHash) {
    const basic = parseBasicAuth(authHeader);
    if (basic && (await verifyPassword(room.passwordHash, basic.password))) {
      role = 'password';
    }
  }

  if (!role) {
    await incrementFailedAttempts(ip, roomId);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (opts?.requireAdmin && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
