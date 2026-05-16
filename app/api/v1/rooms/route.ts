import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

const createRoomSchema = z.object({
  name: z.string().min(1).max(255),
  password: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, password } = createRoomSchema.parse(json);

    const editKey = crypto.randomUUID();
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const [newRoom] = await db.insert(rooms).values({
      name,
      editKey,
      passwordHash,
    }).returning();

    return NextResponse.json({ 
      room: newRoom, 
      editKey 
    }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}