export interface BalanceSheet {
  deposited: number;   // Сколько внес в депозит (отдал деньги)
  received: number;    // Сколько получил в депозит (принял деньги)
  spent: number;       // Сколько потратил из своих/полученных
  consumed: number;    // Сколько потребил (доля в тратах)
  balance: number;     // Итог: + должен получить, - должен внести
}

export function calculateBalances(
  participants: { id: string }[],
  events: { 
    id: string; 
    payerId: string | null; 
    amount: number; 
    isReverted: boolean; 
    entries: { participantId: string | null; amount: number }[] 
  }[],
  deposits: { 
    participantId: string;  // кто внес
    receiverId: string | null; // кто получил (null = общий котёл)
    amount: number 
  }[]
): Record<string, BalanceSheet> {
  const sheet: Record<string, BalanceSheet> = {};
  for (const p of participants) {
    sheet[p.id] = { deposited: 0, received: 0, spent: 0, consumed: 0, balance: 0 };
  }

  // Депозиты
  for (const d of deposits) {
    // Кто внес — отдал деньги
    if (sheet[d.participantId]) {
      sheet[d.participantId].deposited += d.amount;
    }
    // Кто получил — принял деньги (или общий котёл)
    if (d.receiverId && sheet[d.receiverId]) {
      sheet[d.receiverId].received += d.amount;
    }
  }

  // События и записи
  for (const e of events) {
    if (e.isReverted) continue;
    
    // Плательщик потратил деньги
    if (e.payerId && sheet[e.payerId]) {
      sheet[e.payerId].spent += e.amount;
    }
    
    // Потребители
    for (const entry of e.entries || []) {
      if (entry.participantId && sheet[entry.participantId]) {
        sheet[entry.participantId].consumed += entry.amount;
      }
    }
  }

  // Финальный баланс
  // Формула: (получено - внесено) + (потрачено - потреблено)
  // Если внес депозит → должен получить обратно (или он уже учтен в received у другого)
  for (const id in sheet) {
    const s = sheet[id];
    // Баланс = (получил в депозит - внес в депозит) + (потратил - потребил)
    s.balance = (s.received - s.deposited) + (s.spent - s.consumed);
  }

  return sheet;
}