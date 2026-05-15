import { NextResponse } from 'next/server';
import { renameParticipant, deleteParticipant, countParticipantsInRoom } from '@/lib/repositories/participant';
import { db } from '@/db';
import { participants, rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

function parseBasicAuth(header: string): { username: string; password: string } | null {
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return null;
  try {
    const decoded = atob(parts[1]);
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const editKey = request.headers.get('X-Edit-Key');
  const participantKey = request.headers.get('X-Participant-Key');
  const authHeader = request.headers.get('Authorization');

  let canEdit = false;

  if (editKey) {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
    if (room?.editKey === editKey) canEdit = true;
  }

  if (!canEdit && participantKey) {
    const p = await db.query.participants.findFirst({ where: eq(participants.id, pid) });
    if (p?.participantKey === participantKey && p.roomId === id) canEdit = true;
  }

  if (!canEdit && authHeader) {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
    if (room?.passwordHash) {
      const basic = parseBasicAuth(authHeader);
      if (basic && (await verifyPassword(room.passwordHash, basic.password))) canEdit = true;
    }
  }

  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const participant = await renameParticipant(pid, parsed.data.name);
  return NextResponse.json(participant);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;

  const editKey = request.headers.get('X-Edit-Key');
  const authHeader = request.headers.get('Authorization');

  let canDelete = false;

  if (editKey) {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
    if (room?.editKey === editKey) canDelete = true;
  }

  if (!canDelete && authHeader) {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) });
    if (room?.passwordHash) {
      const basic = parseBasicAuth(authHeader);
      if (basic && (await verifyPassword(room.passwordHash, basic.password))) canDelete = true;
    }
  }

  if (!canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const count = await countParticipantsInRoom(id);
  if (count <= 1) {
    return NextResponse.json({ error: 'last_participant' }, { status: 409 });
  }

  await deleteParticipant(pid);
  return NextResponse.json({ success: true });
}
