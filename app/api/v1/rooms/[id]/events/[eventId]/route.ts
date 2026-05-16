import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id: roomId, eventId } = await params;

  // ✅ Исправлено: передаём req и деструктурируем role вместо auth
  const { role, participantId, response } = await getAuthContext(roomId, req);
  if (response) return response;

  try {
    // 1. Находим событие, чтобы проверить права и статус
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.roomId, roomId)),
      columns: { id: true, isReverted: true, payerId: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    if (event.isReverted) {
      return NextResponse.json({ error: 'Событие уже отменено' }, { status: 409 });
    }

    // 2. Проверка прав: админ ИЛИ плательщик события (через participantKey)
    const isPayer = role === 'participant' && participantId === event.payerId;
    if (role !== 'admin' && !isPayer) {
      return NextResponse.json({ error: 'Откатить операцию может только создатель комнаты или плательщик' }, { status: 403 });
    }

    // 3. Откатываем событие
    await db.update(events)
      .set({ isReverted: true, revertedAt: new Date() })
      .where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка отката события:', error);
    return NextResponse.json({ error: 'Не удалось откатить операцию' }, { status: 500 });
  }
}