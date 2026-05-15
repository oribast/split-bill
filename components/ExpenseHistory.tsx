'use client';

import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = {
  id: string;
  name: string;
};

type RoomEvent = {
  id: string;
  name: string;
  totalAmount: number;
  createdAt: string;
  entries: Array<{
    participantId: string;
    amount: number;
    share: number;
  }>;
  creator: { id: string; name: string } | null;
};

export function ExpenseHistory({
  roomId,
  events,
  participants,
  currency,
  isAdmin,
  onRevert,
}: {
  roomId: string;
  events: RoomEvent[];
  participants: Participant[];
  currency: string;
  isAdmin: boolean;
  onRevert: () => void;
}) {
  async function handleRevert(eventId: string, eventName: string) {
    if (!confirm(`Откатить трату "${eventName}"? Это действие нельзя отменить.`)) return;

    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      toast.success('Трата откатена');
      onRevert();
    } else {
      toast.error('Ошибка отката траты');
    }
  }

  if (!events?.length) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        Пока нет трат. Добавьте первую трату выше.
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-1">История трат</h3>
      {sorted.map((ev) => (
        <div
          key={ev.id}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{ev.name}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(ev.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {ev.creator && ` · ${ev.creator.name}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg tabular-nums">
                {(ev.totalAmount / 100).toFixed(2)} {currency}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleRevert(ev.id, ev.name)}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  Откатить
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
            {ev.entries.map((entry) => {
              const person = participants.find((p) => p.id === entry.participantId);
              return (
                <div key={entry.participantId} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{person?.name ?? 'Unknown'}</span>
                  <span className="tabular-nums">
                    <span className={entry.amount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                      заплатил: {(entry.amount / 100).toFixed(2)}
                    </span>
                    <span className="mx-1 text-gray-400">·</span>
                    <span>доля: {(entry.share / 100).toFixed(2)}</span>
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
