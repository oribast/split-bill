import { NextResponse } from 'next/server';
import { db } from '@/db';
import { participants } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({ name: z.string().min(1).max(255) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id: roomId, pid } = await params;
  const { role, participantId, response } = await getAuthContext(roomId, req);
  if (response) return response;

  if (role !== 'admin' && !(role === 'participant' && participantId === pid)) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const { name } = updateSchema.parse(json);

    await db.update(participants)
      .set({ name })
      .where(and(eq(participants.roomId, roomId), eq(participants.id, pid)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id: roomId, pid } = await params;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Только создатель может удалять участников' }, { status: 403 });
  }

  const res = await db
    .select({ count: count() })
    .from(participants)
    .where(eq(participants.roomId, roomId));

  const participantCount = res[0]?.count ?? 0;
  if (participantCount <= 1) {
    return NextResponse.json({ error: 'last_participant' }, { status: 409 });
  }

  try {
    const deleted = await db.delete(participants)
      .where(and(eq(participants.roomId, roomId), eq(participants.id, pid)))
      .returning({ id: participants.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления участника:', error);
    return NextResponse.json({ error: 'Не удалось удалить участника' }, { status: 500 });
  }
}