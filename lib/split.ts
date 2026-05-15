export type SplitResult = Array<{
  participantId: string;
  amount: number;
  share: number;
}>;

export function splitEqual(
  totalAmount: number,
  participantIds: string[]
): SplitResult {
  if (participantIds.length === 0) {
    throw new Error('No participants');
  }

  const sortedIds = [...participantIds].sort();
  const base = Math.floor(totalAmount / sortedIds.length);
  const remainder = totalAmount - base * sortedIds.length;

  return sortedIds.map((id, idx) => ({
    participantId: id,
    amount: 0,
    share: base + (idx < remainder ? 1 : 0),
  }));
}

export function splitIndividual(
  payerId: string,
  participantIds: string[],
  totalAmount: number
): SplitResult {
  if (participantIds.length === 0) {
    throw new Error('No participants');
  }

  const sortedIds = [...participantIds].sort();
  const base = Math.floor(totalAmount / sortedIds.length);
  const remainder = totalAmount - base * sortedIds.length;

  const result: SplitResult = [];
  const payerInList = sortedIds.includes(payerId);

  // Если плательщик не в списке участников — добавляем отдельно (заплатил, но не потреблял)
  if (!payerInList) {
    result.push({
      participantId: payerId,
      amount: totalAmount,
      share: 0,
    });
  }

  sortedIds.forEach((id, idx) => {
    result.push({
      participantId: id,
      amount: id === payerId ? totalAmount : 0,
      share: base + (idx < remainder ? 1 : 0),
    });
  });

  return result;
}

export function splitShared(
  payerId: string,
  participantIds: string[],
  totalAmount: number
): SplitResult {
  if (participantIds.length === 0) {
    throw new Error('No participants');
  }

  const sortedIds = [...participantIds].sort();
  const base = Math.floor(totalAmount / sortedIds.length);
  const remainder = totalAmount - base * sortedIds.length;

  const result: SplitResult = [];
  const payerInList = sortedIds.includes(payerId);

  if (!payerInList) {
    result.push({
      participantId: payerId,
      amount: totalAmount,
      share: 0,
    });
  }

  sortedIds.forEach((id, idx) => {
    result.push({
      participantId: id,
      amount: id === payerId ? totalAmount : 0,
      share: base + (idx < remainder ? 1 : 0),
    });
  });

  return result;
}
