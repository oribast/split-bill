import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/repositories/room';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(1).max(100).optional(),
  currency: z.string().length(3).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const room = await createRoom(parsed.data);
  return NextResponse.json(room, { status: 201 });
}
