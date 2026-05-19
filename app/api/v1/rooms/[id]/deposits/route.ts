import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deposits } from '@/db/schema';
import { getAuthContext } from '@/lib/auth';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';

const schema = z.object({
  participantId: z.string().uuid(),
  receiverId: z.string().uuid().nullable().optional(), // ✅ Добавлено
  amount: z.number().int().positive(),
  isAdvance: z.boolean().optional().default(false),
  note: z.string().max(255).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const { role, response } = await getAuthContext(roomId, req);
  if (response) return response;
  if (role !== 'admin') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

  try {
    const json = await req.json();
    const { participantId, receiverId, amount, isAdvance, note } = schema.parse(json);

    await db.insert(deposits).values({ 
      roomId, 
      participantId, 
      receiverId, // ✅ Добавлено
      amount, 
      isAdvance, 
      note 
    });
    revalidateTag(`settlements-${roomId}`);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: 'Ошибка создания взноса' }, { status: 500 });
  }
}