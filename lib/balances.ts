export interface BalanceSheet {
  deposited: number;   // Сколько внес в депозит (отдал деньги)
  received: number;    // Сколько получил в депозит (принял деньги)
  spent: number;       // Сколько потратил из своих/общих
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
    receiverId?: string | null; // ✅ Опционально: не ломает типы, если колонки ещё нет в БД
    amount: number;
  }[]
): Record<string, BalanceSheet> {
  const sheet: Record<string, BalanceSheet> = {};
  
  // Инициализация нулями для всех участников
  for (const p of participants) {
    sheet[p.id] = { deposited: 0, received: 0, spent: 0, consumed: 0, balance: 0 };
  }

  // 1. Учитываем депозиты
  for (const d of deposits) {
    // Кто внёс → отдал деньги
    if (sheet[d.participantId]) {
      sheet[d.participantId].deposited += d.amount;
    }
    // Кто получил → принял деньги (если указан receiverId)
    if (d.receiverId && sheet[d.receiverId]) {
      sheet[d.receiverId].received += d.amount;
    }
  }

  // 2. Учитываем события (траты)
  for (const e of events) {
    if (e.isReverted) continue;

    // Плательщик потратил деньги
    if (e.payerId && sheet[e.payerId]) {
      sheet[e.payerId].spent += e.amount;
    }

    // Потребители (доли в тратах)
    for (const entry of e.entries || []) {
      if (entry.participantId && sheet[entry.participantId]) {
        sheet[entry.participantId].consumed += entry.amount;
      }
    }
  }

  // 3. Финальный баланс
  // Формула: (получил - отдал) + (потратил - потребил)
  for (const id in sheet) {
    const s = sheet[id];
    s.balance = (s.received - s.deposited) + (s.spent - s.consumed);
  }

  return sheet;
}