import { db } from '@/db';
import { eventEntries, events } from '@/db/schema';
import { eq, sql, isNull } from 'drizzle-orm';

export async function getBalancesByRoomId(roomId: string) {
  const rows = await db
    .select({
      participantId: eventEntries.participantId,
      paid: sql<number>`coalesce(sum(${eventEntries.amount}), 0)`.as('paid'),
      share: sql<number>`coalesce(sum(${eventEntries.share}), 0)`.as('share'),
    })
    .from(eventEntries)
    .innerJoin(events, eq(eventEntries.eventId, events.id))
    .where(eq(events.roomId, roomId) && isNull(events.deletedAt))
    .groupBy(eventEntries.participantId);

  return rows;
}
