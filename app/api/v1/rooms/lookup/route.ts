import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim().toUpperCase();
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const room = await db.query.rooms.findFirst({
    where: or(eq(rooms.id, query), eq(rooms.inviteCode, query)),
    columns: { id: true }
  });

  if (!room) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ roomId: room.id });
}