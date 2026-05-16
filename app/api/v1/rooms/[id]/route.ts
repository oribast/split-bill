import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const roomId = params.id;
  
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      participants: true,
      events: {
        with: {
          entries: true,
          payer: { columns: { id: true, name: true } },
          targetParticipant: { columns: { id: true, name: true } }
        },
        orderBy: (events, { desc }) => [desc(events.createdAt)]
      }
    }
  });

  if (!room) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const safeIso = (val: Date | string | null | undefined): string | null => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  return NextResponse.json({
    room: {
      ...room,
      createdAt: safeIso(room.createdAt),
      events: room.events.map(ev => ({
        ...ev,
        createdAt: safeIso(ev.createdAt),
        revertedAt: safeIso(ev.revertedAt),
      }))
    }
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const roomId = params.id;
  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  if (auth?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(rooms).where(eq(rooms.id, roomId));
  return NextResponse.json({ success: true });
}