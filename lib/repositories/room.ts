import { db } from '@/db';
import { rooms, participants, events, eventEntries, auditLogs } from '@/db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function createRoom(data: { name: string; password?: string; currency?: string }) {
  const id = generateId();
  const editKey = generateId();
  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const [room] = await db
    .insert(rooms)
    .values({ id, name: data.name, editKey, passwordHash, currency: data.currency ?? 'RUB' })
    .returning();

  return room;
}

export async function getRoomById(id: string) {
  return db.query.rooms.findFirst({
    where: (roomsTable, { eq }) => eq(roomsTable.id, id),
    with: {
      participants: true,
      events: {
        with: {
          entries: true,
          creator: true,
        },
        where: (eventsTable, { isNull }) => isNull(eventsTable.deletedAt),
      },
    },
  });
}

export async function deleteRoom(id: string, editKey: string, ipAddress?: string) {
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
  if (!room) throw new Error('Room not found');
  if (room.editKey !== editKey) throw new Error('Invalid edit key');

  await db.transaction(async (tx) => {
    await tx.delete(eventEntries).where(
      inArray(
        eventEntries.eventId,
        tx.select({ id: events.id }).from(events).where(eq(events.roomId, id))
      )
    );
    await tx.delete(events).where(eq(events.roomId, id));
    await tx.delete(participants).where(eq(participants.roomId, id));
    await tx.delete(rooms).where(eq(rooms.id, id));
  });

  await db.insert(auditLogs).values({
    roomId: null,
    action: 'room_deleted',
    payload: { roomId: id, deletedAt: new Date().toISOString() },
    ipAddress: ipAddress ?? null,
  });

  return { success: true };
}
