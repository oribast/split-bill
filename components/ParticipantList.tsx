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

  const totalNet = participants.reduce((sum, p) => sum + (p.net || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Баланс</h3>
      <div className="space-y-3">
        {participants.map((p) => {
          const net = p.net || 0;
          const isPositive = net >= 0;
          return (
            <div key={p.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{p.name}</span>
              <span
                className={`font-semibold tabular-nums ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {(net / 100).toFixed(2)} {currency}
              </span>
            </div>
          );
        })}
      </div>
      {participants.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>Всего в обороте</span>
          <span className="font-medium">{(Math.abs(totalNet) / 100).toFixed(2)} {currency}</span>
        </div>
      )}
    </div>
  );
}
