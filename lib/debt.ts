export interface Settlement {
  fromId: string;
  toId: string;
  amount: number; // копейки
}

export function calculateSettlements(balances: Record<string, number>): Settlement[] {
  // 1. Коррекция расхождения в 1 копейку (округление при распределении)
  const drift = Object.values(balances).reduce((sum, b) => sum + b, 0);
  if (drift !== 0) {
    let maxAbsId = '';
    let maxAbsVal = 0;
    for (const [id, b] of Object.entries(balances)) {
      if (Math.abs(b) > maxAbsVal) { maxAbsVal = Math.abs(b); maxAbsId = id; }
    }
    if (maxAbsId) balances = { ...balances, [maxAbsId]: balances[maxAbsId] - drift };
  }

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, b] of Object.entries(balances)) {
    if (b < 0) debtors.push({ id, amount: b });
    else if (b > 0) creditors.push({ id, amount: b });
  }

  // Сортировка: должники по возрастанию (самые большие долги первыми), кредиторы по убыванию
  debtors.sort((a, b) => a.amount - b.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(Math.abs(debtors[i].amount), creditors[j].amount);
    if (transfer > 0) {
      result.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: transfer });
    }
    debtors[i].amount += transfer;
    creditors[j].amount -= transfer;
    if (Math.abs(debtors[i].amount) < 1) i++;
    if (creditors[j].amount < 1) j++;
  }

  return result; // Гарантия: не более N-1 переводов
}