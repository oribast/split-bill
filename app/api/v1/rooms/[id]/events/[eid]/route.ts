import { NextResponse } from 'next/server';
import { revertEvent } from '@/lib/repositories/event';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const { eid } = await params;
  const event = await revertEvent(eid);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json(event);
}
