import { db } from '@/db';
import { events, eventEntries, idempotencyKeys } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export type CreateEventInput = {
  roomId: string;
  name: string;
  totalAmount: number;
  createdBy?: string;
  entries: Array<{ participantId: string; amount: number; share: number }>;
};

export async function createEventWithEntries(
  data: CreateEventInput,
  idempotencyKey?: string
) {
  const eventId = generateId();

  return db.transaction(async (tx) => {
    if (idempotencyKey) {
      await tx.insert(idempotencyKeys).values({
        id: generateId(),
        roomId: data.roomId,
        key: idempotencyKey,
        eventId,
      });
    }

    const [event] = await tx
      .insert(events)
      .values({
        id: eventId,
        roomId: data.roomId,
        name: data.name,
        totalAmount: data.totalAmount,
        createdBy: data.createdBy ?? null,
        isReverted: false,
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
      .set({
        isReverted: true,
        revertedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  });
}

export async function getActiveEventsByRoomId(roomId: string) {
  return db.query.events.findMany({
    where: (eventsTable, { eq, and }) =>
      and(eq(eventsTable.roomId, roomId), eq(eventsTable.isReverted, false)),
    with: {
      entries: true,
      creator: true,
    },
  });
}

export async function clearAllEvents(roomId: string) {
  return db.transaction(async (tx) => {
    await tx
      .delete(eventEntries)
      .where(
        inArray(
          eventEntries.eventId,
          tx.select({ id: events.id }).from(events).where(eq(events.roomId, roomId))
        )
      );
    await tx.delete(events).where(eq(events.roomId, roomId));
  });
}
