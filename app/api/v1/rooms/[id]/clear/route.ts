import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, events, eventEntries, deposits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;
  if (role !== 'admin') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

  try {
    // Удаляем в правильном порядке из-за foreign keys
    await db.delete(eventEntries).where(eq(eventEntries.eventId, db.select({ id: events.id }).from(events).where(eq(events.roomId, roomId))));
    await db.delete(events).where(eq(events.roomId, roomId));
    await db.delete(deposits).where(eq(deposits.roomId, roomId));
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка очистки данных' }, { status: 500 });
  }
}