import { NextResponse } from 'next/server';
import { createEventWithEntries } from '@/lib/repositories/event';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  totalAmount: z.number().int().positive(),
  createdBy: z.string().uuid().optional(),
  entries: z.array(
    z.object({
      participantId: z.string().uuid(),
      amount: z.number().int().min(0),
      share: z.number().int().min(0),
    })
  ).min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const event = await createEventWithEntries({
    roomId: id,
    ...parsed.data,
  });

  return NextResponse.json(event, { status: 201 });
}
