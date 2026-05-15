import { NextResponse } from 'next/server';
import { getBalancesByRoomId } from '@/lib/repositories/balance';
import { db } from '@/db';
import { participants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const balances = await getBalancesByRoomId(id);
  const participantList = await db.query.participants.findMany({
    where: eq(participants.roomId, id),
  });

  const result = participantList.map((p) => {
    const b = balances.find((x) => x.participantId === p.id);
    return {
      participantId: p.id,
      name: p.name,
      paid: b?.paid ?? 0,
      share: b?.share ?? 0,
      net: (b?.paid ?? 0) - (b?.share ?? 0),
    };
  });

  return NextResponse.json(result);
}
