'use client';

import { User, TrendingUp, TrendingDown } from 'lucide-react';

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
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function ParticipantList({
  participants,
  currency,
}: {
  participants?: Participant[];
  currency: string;
}) {
  if (!participants?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Нет участников
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Баланс</h3>
      <div className="space-y-3">
        {participants.map((p) => {
          const net = p.net || 0;
          const isPositive = net >= 0;
          return (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${avatarColor(p.id)} text-white flex items-center justify-center text-sm font-bold`}>
                  {initials(p.name)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    заплатил {(p.paid || 0) / 100} · доля {(p.share || 0) / 100}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-1 font-bold tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{(net / 100).toFixed(2)} {currency}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
