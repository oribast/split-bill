import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateSettlements } from '@/lib/debt';
import { calculateBalances } from '@/lib/balances';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      participants: true,
      events: { with: { entries: true } },
      deposits: true
    }
  });

  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const balances = calculateBalances(room.participants, room.events, room.deposits);
  const balanceMap: Record<string, number> = {};
  for (const [id, sheet] of Object.entries(balances)) {
    balanceMap[id] = sheet.balance;
  }

  const settlements = calculateSettlements(balanceMap);
  return NextResponse.json({ settlements });
}