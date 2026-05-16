import { NextResponse } from 'next/server';
import { db } from '@/db';
import { participants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';

const updateParticipantSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id: roomId, pid: participantId } = await params;
  
  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;

  if (auth?.role !== 'admin' && !(auth?.role === 'participant' && auth.participantId === participantId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const { name } = updateParticipantSchema.parse(json);

    await db.update(participants)
      .set({ name })
      .where(and(eq(participants.id, participantId), eq(participants.roomId, roomId)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id: roomId, pid: participantId } = await params;

  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  if (auth?.role !== 'admin') {
    return NextResponse.json({ error: 'Только создатель комнаты может удалять участников' }, { status: 403 });
  }

  try {
    const deleted = await db
      .delete(participants)
      .where(
        and(
          eq(participants.roomId, roomId),
          eq(participants.id, participantId)
        )
      )
      .returning({ id: participants.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления участника:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить участника' },
      { status: 500 }
    );
  }
}