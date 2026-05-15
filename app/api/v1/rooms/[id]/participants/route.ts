import { NextResponse } from 'next/server';
import { addParticipant, getParticipantsByRoomId } from '@/lib/repositories/participant';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getParticipantsByRoomId(id);
  return NextResponse.json(list);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const participant = await addParticipant(id, parsed.data.name);
  return NextResponse.json(participant, { status: 201 });
}
