import { db } from '@/db';
import { participants } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export async function addParticipant(roomId: string, name: string) {
  const id = generateId();
  const participantKey = generateId();

  const [participant] = await db
    .insert(participants)
    .values({ id, roomId, name, participantKey })
    .returning();

  return participant;
}

export async function getParticipantsByRoomId(roomId: string) {
  return db.query.participants.findMany({
    where: eq(participants.roomId, roomId),
  });
}

export async function renameParticipant(id: string, name: string) {
  const [participant] = await db
    .update(participants)
    .set({ name })
    .where(eq(participants.id, id))
    .returning();

  return participant;
}

export async function deleteParticipant(id: string) {
  const [participant] = await db
    .delete(participants)
    .where(eq(participants.id, id))
    .returning();

  return participant;
}

export async function countParticipantsInRoom(roomId: string) {
  const result = await db
    .select({ value: count() })
    .from(participants)
    .where(eq(participants.roomId, roomId));

  return result[0]?.value ?? 0;
}
