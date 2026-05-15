'use client';

import { Skeleton } from './Skeleton';

type Participant = {
  id: string;
  name: string;
  paid?: number;
  share?: number;
  net?: number;
};

export function ParticipantList({
  participants,
  currency,
  isLoading,
}: {
  participants?: Participant[];
  currency: string;
  isLoading?: boolean;
}) {
  if (isLoading && !participants) return <Skeleton count={3} />;
  if (!participants?.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Баланс</h3>
      <div className="space-y-2">
        {participants.map((p) => (
          <div key={p.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-700 dark:text-gray-300">{p.name}</span>
            <span
              className={`font-medium ${
                (p.net || 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {(p.net || 0) >= 0 ? '+' : ''}
              {((p.net || 0) / 100).toFixed(2)} {currency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
