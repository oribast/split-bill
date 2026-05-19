import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, participants, events, eventEntries, deposits, idempotencyKeys, auditLogs } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: {
      participants: true,
      deposits: true,
      events: {
        with: {
          entries: true,
          payer: { columns: { id: true, name: true } },
          targetParticipant: { columns: { id: true, name: true } }
        },
        orderBy: (events, { desc }) => [desc(events.createdAt)]
      }
    }
  });

  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ room });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, response } = await getAuthContext(id, req);
  if (response) return response;
  
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Только администратор может удалить комнату' }, { status: 403 });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Получаем ID всех событий комнаты
      const roomEvents = await tx.select({ id: events.id }).from(events).where(eq(events.roomId, id));
      const eventIds = roomEvents.map(e => e.id);

      // 2. Явно удаляем зависимости в строгом порядке (обход FK-ограничений)
      if (eventIds.length > 0) {
        await tx.delete(idempotencyKeys).where(inArray(idempotencyKeys.eventId, eventIds));
        await tx.delete(eventEntries).where(inArray(eventEntries.eventId, eventIds));
        await tx.delete(events).where(eq(events.roomId, id));
      }

      await tx.delete(deposits).where(eq(deposits.roomId, id));
      await tx.delete(participants).where(eq(participants.roomId, id));
      await tx.delete(rooms).where(eq(rooms.id, id));

      // 3. Фиксируем удаление в аудите
      await tx.insert(auditLogs).values({
        action: 'room_deleted',
        roomId: id,
        metadata: { deletedAt: new Date().toISOString() }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления комнаты:', error);
    return NextResponse.json({ error: 'Не удалось удалить комнату' }, { status: 500 });
  }
}