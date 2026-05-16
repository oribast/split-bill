import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, eventEntries, idempotencyKeys, participants } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';

const individualExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().min(1).max(10000000),
  payerId: z.string().uuid(),
  targetParticipantId: z.string().uuid(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const roomId = params.id;
  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  if (!auth) return response!; 

  const idempotencyKey = req.headers.get('x-idempotency-key');

  try {
    const json = await req.json();
    const { description, amount, payerId, targetParticipantId } = individualExpenseSchema.parse(json);

    // Валидация принадлежности к комнате
    const validParticipants = await db.query.participants.findMany({
      where: and(
        eq(participants.roomId, roomId),
        inArray(participants.id, [payerId, targetParticipantId])
      ),
      columns: { id: true }
    });
    
    const validIds = new Set(validParticipants.map(p => p.id));
    if (!validIds.has(payerId) || !validIds.has(targetParticipantId)) {
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

    const newEvent = await db.transaction(async (tx) => {
      const [event] = await tx.insert(events).values({
        roomId,
        description,
        amount,
        type: 'individual',
        payerId,
        targetParticipantId,
        isReverted: false,
      }).returning();

      // Для индивидуальной траты запись одна: должник должен всю сумму
      await tx.insert(eventEntries).values({
        eventId: event.id,
        participantId: targetParticipantId,
        amount: amount,
      });

      if (idempotencyKey) {
        await tx.insert(idempotencyKeys).values({
          key: idempotencyKey,
          eventId: event.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }

      return event;
    });

    return NextResponse.json({ success: true, eventId: newEvent.id }, { status: 201 });

  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}