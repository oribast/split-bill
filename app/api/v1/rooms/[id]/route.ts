import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: {
      participants: true,
      deposits: true,
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

  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ room });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, response } = await getAuthContext(id, req);
  if (response) return response;
  
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Только создатель может удалить комнату' }, { status: 403 });
  }

  try {
    await db.transaction(async (tx) => {
      // Каскадное удаление участников/событий настроено на уровне БД
      await tx.delete(rooms).where(eq(rooms.id, id));
      await tx.insert(auditLogs).values({
        action: 'room_deleted',
        roomId: id,
        metadata: { deletedAt: new Date().toISOString() }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка удаления комнаты:', error);
    return NextResponse.json({ error: 'Не удалось удалить комнату' }, { status: 500 });
  }
}