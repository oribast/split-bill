import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, eventEntries, deposits, idempotencyKeys } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;
  if (role !== 'admin') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

  try {
    // 1. Получаем ID всех событий комнаты
    const roomEvents = await db.select({ id: events.id }).from(events).where(eq(events.roomId, roomId));
    const eventIds = roomEvents.map(e => e.id);

    if (eventIds.length > 0) {
      // 2. Удаляем ключи идемпотентности, привязанные к этим событиям
      await db.delete(idempotencyKeys).where(inArray(idempotencyKeys.eventId, eventIds));
      // 3. Удаляем записи событий
      await db.delete(eventEntries).where(inArray(eventEntries.eventId, eventIds));
      // 4. Удаляем сами события
      await db.delete(events).where(eq(events.roomId, roomId));
    }
    
    // 5. Удаляем депозиты
    await db.delete(deposits).where(eq(deposits.roomId, roomId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ClearData] Error:', error);
    return NextResponse.json({ error: 'Ошибка очистки данных' }, { status: 500 });
  }
}