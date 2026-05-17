import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, eventEntries, idempotencyKeys, participants } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { splitAmount } from '@/lib/split';
import { z } from 'zod';

const sharedExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().min(1).max(10000000),
  payerId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1).nonempty(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const roomId = params.id;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const idempotencyKey = req.headers.get('x-idempotency-key');
  
  try {
    const json = await req.json();
    const { description, amount, payerId, participantIds } = sharedExpenseSchema.parse(json);

    // Валидация
    const validParticipants = await db.query.participants.findMany({
      where: and(
        eq(participants.roomId, roomId),
        inArray(participants.id, [...participantIds, payerId])
      ),
      columns: { id: true }
    });
    
    const validIds = new Set(validParticipants.map(p => p.id));
    if (!validIds.has(payerId) || !participantIds.every(id => validIds.has(id))) {
      return NextResponse.json({ error: 'Invalid participant IDs' }, { status: 400 });
    }

    // Идемпотентность
    if (idempotencyKey) {
      const existing = await db.query.idempotencyKeys.findFirst({
        where: eq(idempotencyKeys.key, idempotencyKey)
      });
      if (existing) {
        return NextResponse.json({ success: true, eventId: existing.eventId, idempotent: true });
      }
    }

    const distribution = splitAmount(amount, participantIds);

    // ✅ Убрали transaction, выполняем последовательно
    const [newEvent] = await db.insert(events).values({
      roomId,
      description,
      amount,
      type: 'shared',
      payerId,
      isReverted: false,
    }).returning();

    const entries = Object.entries(distribution).map(([pid, amt]) => ({
      eventId: newEvent.id,
      participantId: pid,
      amount: amt,
    }));

    await db.insert(eventEntries).values(entries);

    if (idempotencyKey) {
      await db.insert(idempotencyKeys).values({
        key: idempotencyKey,
        eventId: newEvent.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    return NextResponse.json({ success: true, eventId: newEvent.id }, { status: 201 });

  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    console.error('Shared expense error:', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}