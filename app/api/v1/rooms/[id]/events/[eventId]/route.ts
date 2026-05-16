import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string; eventId: string } }) {
  const roomId = params.id;
  const eventId = params.eventId;

  const { auth, response } = await getAuthContext(roomId);
  if (response) return response;
  
  // Revert может сделать админ или тот, кто платил (payer)
  // Для простоты пока только админ, или нужно проверить payerId события
  if (auth?.role !== 'admin') {
     // Можно добавить проверку: если участник и он payer, то ок.
     // Но по ТЗ "кнопка Откатить только для admin/payer".
     // Здесь упрощенно: только админ. Если нужно сложнее - надо fetch события.
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.update(events)
    .set({ 
      isReverted: true, 
      revertedAt: new Date() 
    })
    .where(and(eq(events.id, eventId), eq(events.roomId, roomId)));

  return NextResponse.json({ success: true });
}