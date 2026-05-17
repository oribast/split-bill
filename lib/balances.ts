export interface BalanceSheet {
  paidIn: number;   // Внесено (депозиты)
  spent: number;    // Потрачено (оплата событий)
  consumed: number; // Потреблено (доля в событиях)
  balance: number;  // Итог: + должен получить, - должен внести
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
  deposits: { participantId: string; amount: number }[]
): Record<string, BalanceSheet> {
  const sheet: Record<string, BalanceSheet> = {};
  for (const p of participants) {
    sheet[p.id] = { paidIn: 0, spent: 0, consumed: 0, balance: 0 };
  }

  // Депозиты
  for (const d of deposits) {
    if (sheet[d.participantId]) {
      sheet[d.participantId].paidIn += d.amount;
    }
  }

  // События и записи
  for (const e of events) {
    if (e.isReverted) continue;
    
    // Плательщик
    if (e.payerId && sheet[e.payerId]) {
      sheet[e.payerId].spent += e.amount;
    }
    
    // Потребители (игнорируем null, если участник был удалён)
    for (const entry of e.entries || []) {
      if (entry.participantId && sheet[entry.participantId]) {
        sheet[entry.participantId].consumed += entry.amount;
      }
    }
  }

  // Финальный баланс
  for (const id in sheet) {
    sheet[id].balance = sheet[id].paidIn + sheet[id].spent - sheet[id].consumed;
  }

  return sheet;
}