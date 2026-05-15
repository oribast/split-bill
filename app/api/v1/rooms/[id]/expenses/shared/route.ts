import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createEventWithEntries } from '@/lib/repositories/event';
import { findIdempotencyKey } from '@/lib/repositories/idempotency';
import { splitEqual } from '@/lib/split';

const sharedSchema = z.object({
  name: z.string().min(1).max(200),
  totalAmount: z.number().int().min(1).max(10_000_000),
  participantIds: z.array(z.string().uuid()).min(1),
  createdBy: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const body = await request.json();
  const parsed = sharedSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, totalAmount, participantIds, createdBy } = parsed.data;

  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    return NextResponse.json(
      { error: 'Duplicate participant IDs', code: 'duplicate_participants' },
      { status: 400 }
    );
  }

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: { participants: true },
  });

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const validParticipantIds = new Set(room.participants.map((p) => p.id));
  for (const pid of participantIds) {
    if (!validParticipantIds.has(pid)) {
      return NextResponse.json(
        { error: `Participant ${pid} not found in room`, code: 'invalid_participant' },
        { status: 400 }
      );
    }
  }

  const idempotencyKey = request.headers.get('X-Idempotency-Key');
  if (idempotencyKey) {
    const existing = await findIdempotencyKey(roomId, idempotencyKey);
    if (existing?.event) {
      return NextResponse.json(existing.event, { status: 200 });
    }
  }

  const entries = splitEqual(totalAmount, participantIds);

  const event = await createEventWithEntries(
    {
      roomId,
      name,
      totalAmount,
      createdBy,
      entries,
    },
    idempotencyKey ?? undefined
  );

  return NextResponse.json(event, { status: 201 });
}
