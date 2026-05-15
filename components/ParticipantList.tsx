'use client';

import { Skeleton } from './Skeleton';

type Participant = {
  id: string;
  name: string;
  paid?: number;
  share?: number;
  net?: number;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(id: string) {
  const colors = ['#4f46e5', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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
  if (!participants?.length) {
    return (
      <div className="card text-center text-muted text-small py-10">
        Нет участников
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-small font-semibold uppercase tracking-wider text-muted mb-4">
        Баланс
      </h3>
      <div className="flex-col gap-3 flex">
        {participants.map((p) => {
          const net = p.net || 0;
          const isPositive = net >= 0;
          return (
            <div key={p.id} className="flex-between p-3 rounded-xl bg-[var(--color-bg)]">
              <div className="flex items-center gap-3">
                <div
                  className="avatar"
                  style={{ backgroundColor: avatarColor(p.id) }}
                >
                  {initials(p.name)}
                </div>
                <div>
                  <p className="font-medium text-small">{p.name}</p>
                  <p className="text-xs text-muted">
                    заплатил {(p.paid || 0) / 100} · доля {(p.share || 0) / 100}
                  </p>
                </div>
              </div>
              <span className={`tabular ${isPositive ? 'balance-positive' : 'balance-negative'}`}>
                {isPositive ? '+' : ''}
                {(net / 100).toFixed(2)} {currency}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
