import { db } from '@/db';
import { events, eventEntries } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export type CreateEventInput = {
  roomId: string;
  name: string;
  totalAmount: number;
  createdBy?: string;
  entries: Array<{ participantId: string; amount: number; share: number }>;
};

export async function createEventWithEntries(data: CreateEventInput) {
  const eventId = generateId();

  return db.transaction(async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({
        id: eventId,
        roomId: data.roomId,
        name: data.name,
        totalAmount: data.totalAmount,
        createdBy: data.createdBy ?? null,
      })
      .returning();

    if (data.entries.length > 0) {
      await tx.insert(eventEntries).values(
        data.entries.map((entry) => ({
          id: generateId(),
          eventId,
          participantId: entry.participantId,
          amount: entry.amount,
          share: entry.share,
        }))
      );
    }

    return event;
  });
}

export async function revertEvent(eventId: string) {
  return db.transaction(async (tx) => {
    await tx.delete(eventEntries).where(eq(eventEntries.eventId, eventId));
    const [event] = await tx
      .update(events)
      .set({ deletedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  });
}

export async function getActiveEventsByRoomId(roomId: string) {
  return db.query.events.findMany({
    where: (eventsTable) => eq(eventsTable.roomId, roomId) && isNull(eventsTable.deletedAt),
    with: {
      entries: true,
      creator: true,
    },
  });
}
