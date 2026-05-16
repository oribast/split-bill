import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, participants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export type AuthRole = 'admin' | 'participant' | null;

export interface AuthContext {
  role: AuthRole;
  participantId?: string;
  response: NextResponse | null;
}

export async function getAuthContext(roomId: string, req: Request): Promise<AuthContext> {
  const headers = req.headers;
  const editKey = headers.get('x-edit-key');
  const participantKey = headers.get('x-participant-key');
  const authHeader = headers.get('authorization');

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    columns: { id: true, editKey: true, passwordHash: true }
  });

  if (!room) {
    return { role: null, response: NextResponse.json({ error: 'Комната не найдена' }, { status: 404 }) };
  }

  // 1️⃣ Приоритет: X-Edit-Key (Admin)
  if (editKey && editKey === room.editKey) {
    return { role: 'admin', response: null };
  }

  // 2️⃣ Приоритет: X-Participant-Key (Participant)
  if (participantKey) {
    const p = await db.query.participants.findFirst({
      where: and(eq(participants.roomId, roomId), eq(participants.participantKey, participantKey)),
      columns: { id: true }
    });
    if (p) {
      return { role: 'participant', participantId: p.id, response: null };
    }
  }

  // 3️⃣ Приоритет: Authorization: Basic (Password → Admin)
  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      const [, password] = decoded.split(':');
      if (password && room.passwordHash) {
        const isValid = await bcrypt.compare(password, room.passwordHash);
        if (isValid) {
          return { role: 'admin', response: null };
        }
      }
    } catch {
      // Некорректный Base64 или формат заголовка
    }
  }

  // ❌ Доступ запрещён
  return { role: null, response: NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 }) };
}