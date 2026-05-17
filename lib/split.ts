export function splitAmount(amount: number, participantIds: string[]): Record<string, number> {
  if (participantIds.length === 0) return {};
  const sortedIds = [...participantIds].sort(); // Детерминизм
  const count = sortedIds.length;
  const baseShare = Math.floor(amount / count);
  const remainder = amount % count;

  const distribution: Record<string, number> = {};
  sortedIds.forEach((id, index) => {
    distribution[id] = baseShare + (index < remainder ? 1 : 0);
  });
  return distribution;
}