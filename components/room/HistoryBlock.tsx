"use client";
import { IconRefresh, IconBanknote } from "@/components/Icons";

interface EventEntry { participantId: string | null; amount: number; }
interface RoomEvent {
  id: string;
  description: string;
  amount: number;
  type: 'shared' | 'individual';
  payerId: string | null;
  isReverted: boolean;
  createdAt: string | Date;
  entries: EventEntry[];
}

interface Deposit {
  id: string;
  participantId: string;
  amount: number;
  isAdvance: boolean;
  note: string | null;
  createdAt: string | Date;
}

interface Props {
  events: RoomEvent[];
  deposits: Deposit[];
  participants: { id: string; name: string }[];
  isUnlocked: boolean;
  handleRollback: (eventId: string) => void;
}

export default function HistoryBlock({ events, deposits, participants, isUnlocked, handleRollback }: Props) {
  const getName = (id: string | null) => id ? participants.find(p => p.id === id)?.name || 'Удалённый' : '—';
  const fmt = (c: number) => (c / 100).toFixed(2) + ' ₽';
  const fmtDate = (d: string | Date) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  // ✅ Объединяем события и депозиты в единый список
  const history = [
    ...events.map(e => ({ type: 'event' as const, id: e.id, createdAt: e.createdAt, data: e })),
    ...deposits.map(d => ({ type: 'deposit' as const, id: d.id, createdAt: d.createdAt, data: d }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (history.length === 0) {
    return <div className="empty-state"><div className="empty-icon">📜</div><div className="empty-title">История пуста</div><div className="empty-subtitle">Здесь будут отображаться все операции</div></div>;
  }

  return (
    <div className="logs-modern">
      {history.map(item => {
        if (item.type === 'deposit') {
          const d = item.data as Deposit;
          return (
            <div key={d.id} className="log-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <div className="log-card-header">
                <div className="log-card-meta">
                  <span className="log-badge" style={{ background: 'rgba(66,153,225,0.12)', color: 'var(--accent-primary)' }}>
                    {d.isAdvance ? 'Аванс' : 'Взнос'}
                  </span>
                  <span className="log-date">{fmtDate(d.createdAt)}</span>
                </div>
              </div>
              <div className="log-card-body">
                <div className="log-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconBanknote className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  {getName(d.participantId)} внёс {fmt(d.amount)}
                </div>
                {d.note && <div className="log-note-modern">{d.note}</div>}
              </div>
            </div>
          );
        }

        const e = item.data as RoomEvent;
        return (
          <div key={e.id} className={`log-card ${e.type} ${e.isReverted ? 'reverted' : ''}`}>
            <div className="log-card-header">
              <div className="log-card-meta">
                <span className={`log-badge ${e.type}`}>{e.type === 'shared' ? 'Общий' : 'Личный'}</span>
                <span className="log-date">{fmtDate(e.createdAt)}</span>
                {e.isReverted && <span className="reverted-label">Откачено</span>}
              </div>
              {isUnlocked && !e.isReverted && (
                <button onClick={() => handleRollback(e.id)} className="password-toggle" title="Откатить">
                  <IconRefresh className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="log-card-body">
              <div className="log-title">{e.description}</div>
              <div className="log-payer">
                <span className="log-label">Плательщик:</span> {getName(e.payerId)}
              </div>
            </div>
            <div className="log-entries-modern">
              {e.entries.map((entry, idx) => (
                <div key={idx} className="log-entry-row">
                  <span className="entry-name">{getName(entry.participantId)}</span>
                  <span className="entry-amount">{fmt(entry.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}