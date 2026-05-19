import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ status: z.enum(['open', 'closed']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;
  if (role !== 'admin') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

  try {
    const json = await req.json();
    const { status } = schema.parse(json);
    await db.update(rooms).set({ status }).where(eq(rooms.id, roomId));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: 'Ошибка обновления статуса' }, { status: 500 });
  }
}