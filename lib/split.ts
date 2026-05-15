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
  if (!participantIds.includes(payerId)) {
    throw new Error('Payer must be in participants');
  }

  const sortedIds = [...participantIds].sort();
  const base = Math.floor(totalAmount / sortedIds.length);
  const remainder = totalAmount - base * sortedIds.length;

  return sortedIds.map((id, idx) => ({
    participantId: id,
    amount: id === payerId ? totalAmount : 0,
    share: base + (idx < remainder ? 1 : 0),
  }));
}
