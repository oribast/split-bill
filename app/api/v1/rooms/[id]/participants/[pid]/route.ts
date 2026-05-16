import { NextResponse } from 'next/server';
import { db } from '@/db';
import { participants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';

const updateParticipantSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function PUT(req: Request, { params }: { params: { id: string; pid: string } }) {
  const roomId = params.id;
  const pid = params.pid;
  
  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;

  // Доступно админу или самому участнику
  if (auth?.role !== 'admin' && !(auth?.role === 'participant' && auth.participantId === pid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const { name } = updateParticipantSchema.parse(json);

    await db.update(participants)
      .set({ name })
      .where(and(eq(participants.id, pid), eq(participants.roomId, roomId)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; pid: string } }) {
  const roomId = params.id;
  const pid = params.pid;

  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  if (auth?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Проверка: не последний ли участник?
  const allParticipants = await db.query.participants.findMany({
    where: eq(participants.roomId, roomId)
  });

  if (allParticipants.length <= 1) {
    return NextResponse.json({ error: 'Cannot delete last participant', code: 'last_participant' }, { status: 409 });
  }

  await db.delete(participants)
    .where(and(eq(participants.id, pid), eq(participants.roomId, roomId)));

  return NextResponse.json({ success: true });
}