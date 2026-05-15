import { db } from '@/db';
import { eventEntries, events } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export async function getBalancesByRoomId(roomId: string) {
  const rows = await db
    .select({
      participantId: eventEntries.participantId,
      paid: sql<number>`coalesce(sum(${eventEntries.amount}), 0)`.as('paid'),
      share: sql<number>`coalesce(sum(${eventEntries.share}), 0)`.as('share'),
    })
    .from(eventEntries)
    .innerJoin(events, eq(eventEntries.eventId, events.id))
    .where(and(eq(events.roomId, roomId), eq(events.isReverted, false)))
    .groupBy(eventEntries.participantId);

  return rows;
}
