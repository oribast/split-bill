export interface Settlement {
  fromId: string;
  toId: string;
  amount: number; // копейки
}

export function calculateSettlements(balances: Record<string, number>): Settlement[] {
  // 1. Фильтруем участников с нулевым балансом
  const entries = Object.entries(balances)
    .map(([id, b]) => ({ id, amount: b }))
    .filter(e => Math.abs(e.amount) >= 1);

  if (entries.length === 0) return [];

  // 2. Коррекция расхождения в 1 копейку (округление при распределении)
  const drift = entries.reduce((sum, e) => sum + e.amount, 0);
  if (drift !== 0) {
    entries.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    entries[0].amount -= drift;
  }

  const debtors = entries.filter(e => e.amount < 0).sort((a, b) => a.amount - b.amount);
  const creditors = entries.filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(Math.abs(debtors[i].amount), creditors[j].amount);
    if (transfer >= 1) {
      result.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: transfer });
    }
    debtors[i].amount += transfer;
    creditors[j].amount -= transfer;
    if (Math.abs(debtors[i].amount) < 1) i++;
    if (creditors[j].amount < 1) j++;
  }

  return result; // Гарантия: не более N-1 переводов, круговые долги = 0
}