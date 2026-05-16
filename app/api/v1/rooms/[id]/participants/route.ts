import { NextResponse } from 'next/server';
import { db } from '@/db';
import { participants, rooms } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const addParticipantSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const roomId = params.id;
  
  // Проверка авторизации (Admin или любой участник комнаты может добавлять? Обычно только админ)
  // По ТЗ: "POST ... добавление участника". Не указано ограничение, но логично только для Admin.
  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  if (auth?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const { name } = addParticipantSchema.parse(json);
    
    const participantKey = crypto.randomUUID();

    const [newParticipant] = await db.insert(participants).values({
      roomId,
      name,
      participantKey,
    }).returning();

    return NextResponse.json({ participant: newParticipant, participantKey }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}