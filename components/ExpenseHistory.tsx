'use client';

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
  async function handleRevert(eventId: string) {
    if (!confirm('Откатить трату? Это действие нельзя отменить.')) return;

    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.ok) onRevert();
  }

  if (!events?.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        Пока нет трат
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((ev) => (
        <div
          key={ev.id}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{ev.name}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(ev.createdAt).toLocaleDateString('ru-RU')}
                {ev.creator && ` · ${ev.creator.name}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {(ev.totalAmount / 100).toFixed(2)} {currency}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleRevert(ev.id)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Откатить
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {ev.entries.map((entry) => {
              const person = participants.find((p) => p.id === entry.participantId);
              return (
                <div key={entry.participantId} className="flex justify-between">
                  <span>{person?.name ?? 'Unknown'}</span>
                  <span>
                    заплатил: {(entry.amount / 100).toFixed(2)}, доля:{' '}
                    {(entry.share / 100).toFixed(2)}
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
