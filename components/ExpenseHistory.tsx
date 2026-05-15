'use client';

import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/client-auth';
import { Calendar } from 'lucide-react';

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
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <div className="empty-title">Пока нет операций</div>
        <div className="empty-subtitle">Начислите или распределите сумму — записи появятся здесь</div>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="logs-modern">
      {sorted.map((ev) => {
        const date = new Date(ev.createdAt);
        const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const isIndividual = ev.entries.some((e) => e.amount > 0);
        const typeClass = isIndividual ? 'individual' : 'shared';

        return (
          <div key={ev.id} className={`log-card ${typeClass}`}>
            <div className="log-card-header">
              <div className="log-card-meta">
                <span className={`log-badge ${typeClass}`}>
                  {isIndividual ? 'Личная' : 'Общая'}
                </span>
                <span className="log-date">
                  <Calendar className="icon" style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                  {dateStr} · {timeStr}
                </span>
              </div>
              {isAdmin && (
                <button className="btn-secondary btn-small" onClick={() => handleRevert(ev.id, ev.name)} style={{ color: 'var(--accent-danger)' }}>
                  Откатить
                </button>
              )}
            </div>

            <div className="log-card-body">
              <div className="log-title">{ev.name}</div>
              {ev.creator && <div className="log-payer"><span className="log-label">Создал:</span> {ev.creator.name}</div>}
              <div className="log-payer"><span className="log-label">Сумма:</span> {(ev.totalAmount / 100).toFixed(2)} {currency}</div>
            </div>

            <div className="log-entries-modern">
              {ev.entries.map((entry) => {
                const person = participants.find((p) => p.id === entry.participantId);
                return (
                  <div key={entry.participantId} className="log-entry-row">
                    <span className="entry-name">{person?.name ?? 'Удалённый'}</span>
                    <span className="entry-amount">
                      <span className={entry.amount > 0 ? 'balance-positive' : ''}>
                        заплатил: {(entry.amount / 100).toFixed(2)}
                      </span>
                      <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
                      <span>доля: {(entry.share / 100).toFixed(2)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
