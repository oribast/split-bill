import { NextResponse } from 'next/server';
import { guardRoom } from '@/lib/api-guard';
import { revertEvent } from '@/lib/repositories/event';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const { id: roomId, eid } = await params;

  const guard = await guardRoom(request, roomId, { requireAdmin: true });
  if (guard) return guard;

  const event = await revertEvent(eid);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json(event);
}
