import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFailedAttempts, incrementFailedAttempts } from '@/lib/redis';
import { verifyPassword } from '@/lib/auth';
import { db } from '@/db';
import { rooms, participants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const config = {
  matcher: ['/api/v1/:path*', '/room/:id*'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split('/').filter(Boolean);
  let roomId: string | null = null;

  if (pathname.startsWith('/api/v1/rooms/')) {
    roomId = parts[3] ?? null;
  } else if (pathname.startsWith('/room/')) {
    roomId = parts[1] ?? null;
  }

  if (!roomId) return NextResponse.next();

  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  // const failures = await getFailedAttempts(ip, roomId);
  // if (failures >= 5) {
  //   return NextResponse.json({ error: 'Too many attempts', code: 'rate_limited' }, { status: 429 });
  // }

  if (pathname.startsWith('/room/')) {
    return NextResponse.next();
  }

  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const editKey = request.headers.get('X-Edit-Key');
  const participantKey = request.headers.get('X-Participant-Key');
  const authHeader = request.headers.get('Authorization');

  let authorized = false;

  if (editKey && room.editKey === editKey) {
    authorized = true;
  }

  if (!authorized && participantKey) {
    const p = await db.query.participants.findFirst({
      where: eq(participants.participantKey, participantKey),
    });
    if (p && p.roomId === roomId) authorized = true;
  }

  if (!authorized && authHeader && room.passwordHash) {
    const basic = parseBasicAuth(authHeader);
    if (basic && (await verifyPassword(room.passwordHash, basic.password))) {
      authorized = true;
    }
  }

  if (!authorized) {
    // await incrementFailedAttempts(ip, roomId);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

function parseBasicAuth(header: string): { username: string; password: string } | null {
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return null;
  try {
    const decoded = atob(parts[1]);
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}
