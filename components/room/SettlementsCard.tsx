"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { IconLink } from "@/components/Icons";

interface Settlement { fromId: string; toId: string; amount: number; }

interface Props {
  roomId: string;
  participants: { id: string; name: string }[];
}

export default function SettlementsCard({ roomId, participants }: Props) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/rooms/${roomId}/settlements`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setSettlements(data.settlements))
      .catch(() => toast.error('Ошибка загрузки переводов'))
      .finally(() => setLoading(false));
  }, [roomId]);

  const getName = (id: string) => participants.find(p => p.id === id)?.name || 'Удалённый';
  const fmt = (c: number) => (c / 100).toFixed(2) + ' ₽';

  const copyList = () => {
    const text = settlements.map(s => `${getName(s.fromId)} → ${getName(s.toId)}: ${fmt(s.amount)}`).join('\n');
    navigator.clipboard.writeText(text || 'Переводов нет').then(() => toast.success('Список скопирован'));
  };

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Переводы</h2>
        <button onClick={copyList} className="btn-secondary btn-small flex items-center gap-1">
          <IconLink className="w-4 h-4" /> Скопировать
        </button>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Расчёт...</p>
      ) : settlements.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Все расчёты завершены. Переводов не требуется.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settlements.map((s, i) => (
            <div key={i} style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-danger)' }}>{getName(s.fromId)}</span>
                {' → '}
                <span style={{ color: 'var(--accent-success, #22c55e)' }}>{getName(s.toId)}</span>
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(s.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}