'use client';

import { toast } from 'sonner';
import { Receipt, RotateCcw, Calendar } from 'lucide-react';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = { id: string; name: string };

type RoomEvent = {
  id: string;
  name: string;
  totalAmount: number;
  createdAt: string;
  entries: Array<{ participantId: string; amount: number; share: number }>;
  creator: { id: string; name: string } | null;
};

export function ExpenseHistory({
  roomId,
  events,
  participants,
  currency,
  isAdmin,
  editKey,
  onRevert,
}: {
  roomId: string;
  events: RoomEvent[];
  participants: Participant[];
  currency: string;
  isAdmin: boolean;
  editKey: string;
  onRevert: () => void;
}) {
  async function handleRevert(eventId: string, name: string) {
    if (!confirm(`Откатить трату «${name}»? Это необратимо.`)) return;
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(editKey),
    });
    if (res.ok) {
      toast.success('Трата откатена');
      onRevert();
    } else {
      toast.error('Ошибка отката');
    }
  }

  if (!events?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Пока нет трат</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">История трат</h3>
      {sorted.map((ev) => (
        <div key={ev.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{ev.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(ev.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  {ev.creator && <span>· {ev.creator.name}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{(ev.totalAmount / 100).toFixed(2)} {currency}</span>
              {isAdmin && (
                <button
                  onClick={() => handleRevert(ev.id, ev.name)}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Откатить
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            {ev.entries.map((entry) => {
              const person = participants.find((p) => p.id === entry.participantId);
              return (
                <div key={entry.participantId} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="text-slate-700 dark:text-slate-300">{person?.name ?? 'Unknown'}</span>
                  <span className="tabular-nums">
                    <span className={entry.amount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                      {(entry.amount / 100).toFixed(2)}
                    </span>
                    <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
                    <span>{(entry.share / 100).toFixed(2)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
