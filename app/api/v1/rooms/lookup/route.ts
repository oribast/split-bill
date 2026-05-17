import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q');
    if (!rawQuery) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const query = rawQuery.trim().toUpperCase();

    const room = await db.query.rooms.findFirst({
      where: or(
        eq(rooms.id, query),
        eq(rooms.inviteCode, query)
      ),
      columns: { id: true }
    });

    if (!room) {
      console.log(`[Lookup] Not found for query: ${query}`);
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error('[Lookup] DB Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}