import { NextResponse } from 'next/server';
import { getRoomById, deleteRoom } from '@/lib/repositories/room';
import { guardRoom } from '@/lib/api-guard';
import { z } from 'zod';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoomById(id);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json(room);
}

const deleteSchema = z.object({
  editKey: z.string().uuid(),
});

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardRoom(request, id, { requireAdmin: true });
  if (guard) return guard;

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    await deleteRoom(id, parsed.data.editKey, request.headers.get('x-forwarded-for') ?? undefined);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Room not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === 'Invalid edit key') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
