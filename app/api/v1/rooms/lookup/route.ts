import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q');
    if (!rawQuery) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const query = rawQuery.trim();
    // UUID v4 с дефисами всегда имеет длину 36 символов
    const isUuid = query.length === 36;

    let room;
    if (isUuid) {
      // Поиск по полному ID комнаты
      room = await db.query.rooms.findFirst({
        where: eq(rooms.id, query),
        columns: { id: true }
      });
    } else {
      // Поиск по короткому коду приглашения (регистронезависимо)
      room = await db.query.rooms.findFirst({
        where: eq(rooms.inviteCode, query.toUpperCase()),
        columns: { id: true }
      });
    }

    if (!room) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error('[Lookup] Database error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}