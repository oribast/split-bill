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
      <div className="card text-center py-10 text-muted border-dashed">
        <Receipt className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="text-small">Пока нет трат</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="flex-col gap-3 flex">
      <h3 className="text-small font-semibold uppercase tracking-wider text-muted px-1">
        История трат
      </h3>
      {sorted.map((ev) => (
        <div key={ev.id} className="expense-card">
          <div className="flex-between mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{ev.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(ev.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {ev.creator && <span>· {ev.creator.name}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg tabular">
                {(ev.totalAmount / 100).toFixed(2)} {currency}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleRevert(ev.id, ev.name)}
                  className="btn btn-ghost text-danger text-xs px-2 py-1 h-auto"
                >
                  <RotateCcw className="w-3 h-3" /> Откатить
                </button>
              )}
            </div>
          </div>
          <div className="flex-col gap-1.5 flex text-small">
            {ev.entries.map((entry) => {
              const person = participants.find((p) => p.id === entry.participantId);
              return (
                <div key={entry.participantId} className="flex-between text-muted">
                  <span className="text-text">{person?.name ?? 'Unknown'}</span>
                  <span className="tabular">
                    <span className={entry.amount > 0 ? 'balance-positive' : ''}>
                      {(entry.amount / 100).toFixed(2)}
                    </span>
                    <span className="mx-1 opacity-30">/</span>
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
