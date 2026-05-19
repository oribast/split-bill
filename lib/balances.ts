export interface BalanceSheet {
  deposited: number;
  received: number;
  spent: number;
  consumed: number;
  cashOnHand: number;
  balance: number;
}

export function calculateBalances(
  participants: { id: string }[],
  events: {
    id: string;
    payerId: string | null;
    amount: number;
    isReverted: boolean;
    entries: { participantId: string | null; amount: number }[];
  }[],
  deposits: {
    participantId: string;
    receiverId?: string | null;
    amount: number;
  }[],
  roomStatus: "open" | "closed" = "open" // ✅ Новый параметр
): Record<string, BalanceSheet> {
  const sheet: Record<string, BalanceSheet> = {};
  for (const p of participants) {
    sheet[p.id] = { deposited: 0, received: 0, spent: 0, consumed: 0, cashOnHand: 0, balance: 0 };
  }

  // Траты учитываются всегда
  for (const e of events) {
    if (e.isReverted) continue;
    if (e.payerId && sheet[e.payerId]) sheet[e.payerId].spent += e.amount;
    for (const entry of e.entries || []) {
      if (entry.participantId && sheet[entry.participantId]) {
        sheet[entry.participantId].consumed += entry.amount;
      }
    }
  }

  // ✅ Депозиты учитываются ТОЛЬКО после закрытия комнаты
  if (roomStatus === "closed") {
    for (const d of deposits) {
      if (sheet[d.participantId]) sheet[d.participantId].deposited += d.amount;
      if (d.receiverId && sheet[d.receiverId]) sheet[d.receiverId].received += d.amount;
    }
  }

  for (const id in sheet) {
    const s = sheet[id];
    if (roomStatus === "closed") {
      s.cashOnHand = Math.max(0, s.received - s.spent);
      s.balance = (s.deposited - s.received) + (s.spent - s.consumed);
    } else {
      s.cashOnHand = 0;
      s.balance = s.spent - s.consumed; // Пока открыта → только траты
    }
  }

  return sheet;
}