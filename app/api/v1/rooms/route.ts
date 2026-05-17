import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { generateInviteCode } from '@/lib/short-id';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, password } = schema.parse(json);

    const editKey = randomUUID();
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await db.query.rooms.findFirst({ where: eq(rooms.inviteCode, inviteCode) });
      if (!exists) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const [room] = await db.insert(rooms).values({
      name,
      editKey,
      passwordHash,
      inviteCode,
    }).returning();

    return NextResponse.json({ room, editKey, inviteCode }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    console.error('❌ Room creation error:', e);
    return NextResponse.json({ error: 'Ошибка создания комнаты' }, { status: 500 });
  }
}