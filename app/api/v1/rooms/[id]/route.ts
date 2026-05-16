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

  return NextResponse.json({ room });
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