import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { guardRoom } from '@/lib/api-guard';
import { createEventWithEntries } from '@/lib/repositories/event';
import { findIdempotencyKey } from '@/lib/repositories/idempotency';
import { splitIndividual } from '@/lib/split';

const individualSchema = z.object({
  name: z.string().min(1).max(200),
  totalAmount: z.number().int().min(1).max(10_000_000),
  payerId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1),
  createdBy: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;

  const guard = await guardRoom(request, roomId, { requireAdmin: true });
  if (guard) return guard;

  const body = await request.json();
  const parsed = individualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, totalAmount, payerId, participantIds, createdBy } = parsed.data;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: { participants: true },
  });
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const validParticipantIds = new Set(room.participants.map((p) => p.id));
  if (!validParticipantIds.has(payerId)) {
    return NextResponse.json(
      { error: 'Payer not found in room', code: 'invalid_payer' },
      { status: 400 }
    );
  }

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

  const entries = splitIndividual(payerId, participantIds, totalAmount);
  const event = await createEventWithEntries(
    { roomId, name, totalAmount, createdBy, entries },
    idempotencyKey ?? undefined
  );

  return NextResponse.json(event, { status: 201 });
}
