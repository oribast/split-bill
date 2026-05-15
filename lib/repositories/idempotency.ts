import { db } from '@/db';
import { idempotencyKeys } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function findIdempotencyKey(roomId: string, key: string) {
  return db.query.idempotencyKeys.findFirst({
    where: and(
      eq(idempotencyKeys.roomId, roomId),
      eq(idempotencyKeys.key, key),
      gt(idempotencyKeys.expiresAt, new Date())
    ),
    with: {
      event: true,
    },
  });
}

export async function saveIdempotencyKey(
  roomId: string,
  key: string,
  eventId: string
) {
  const [record] = await db
    .insert(idempotencyKeys)
    .values({
      id: crypto.randomUUID(),
      roomId,
      key,
      eventId,
    })
    .returning();

  return record;
}
