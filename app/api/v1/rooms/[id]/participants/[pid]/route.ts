import { NextResponse } from 'next/server';
import { renameParticipant, deleteParticipant, countParticipantsInRoom } from '@/lib/repositories/participant';
import { guardRoom } from '@/lib/api-guard';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id: roomId, pid } = await params;

  const guard = await guardRoom(request, roomId, { allowParticipant: true });
  if (guard) return guard;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const participant = await renameParticipant(pid, parsed.data.name);
  return NextResponse.json(participant);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id: roomId, pid } = await params;

  const guard = await guardRoom(request, roomId, { requireAdmin: true });
  if (guard) return guard;

  const count = await countParticipantsInRoom(roomId);
  if (count <= 1) {
    return NextResponse.json({ error: 'last_participant' }, { status: 409 });
  }

  await deleteParticipant(pid);
  return NextResponse.json({ success: true });
}
