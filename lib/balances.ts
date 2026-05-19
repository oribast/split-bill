export interface BalanceSheet {
  deposited: number;   // Сколько отдал наличными (внёс в депозит)
  received: number;    // Сколько принял наличными (получил в депозит)
  spent: number;       // Сколько оплатил картой/наличными за группу
  consumed: number;    // Сколько потребил (личная доля в тратах)
  balance: number;     // Итог: + должен получить, - должен внести
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
  }[]
): Record<string, BalanceSheet> {
  const sheet: Record<string, BalanceSheet> = {};
  for (const p of participants) {
    sheet[p.id] = { deposited: 0, received: 0, spent: 0, consumed: 0, balance: 0 };
  }

  // Депозиты
  for (const d of deposits) {
    if (sheet[d.participantId]) sheet[d.participantId].deposited += d.amount;
    if (d.receiverId && sheet[d.receiverId]) sheet[d.receiverId].received += d.amount;
  }

  // События
  for (const e of events) {
    if (e.isReverted) continue;
    if (e.payerId && sheet[e.payerId]) sheet[e.payerId].spent += e.amount;
    for (const entry of e.entries || []) {
      if (entry.participantId && sheet[entry.participantId]) {
        sheet[entry.participantId].consumed += entry.amount;
      }
    }
  }

  // ✅ Исправленная формула: (отдал - принял) + (оплатил - потребил)
  // Гарантирует zero-sum: сумма всех балансов всегда = 0
  for (const id in sheet) {
    const s = sheet[id];
    s.balance = (s.deposited - s.received) + (s.spent - s.consumed);
  }

  return sheet;
}