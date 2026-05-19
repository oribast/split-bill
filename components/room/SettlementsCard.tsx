"use client";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { IconLink } from "@/components/Icons";
import { calculateSettlements } from "@/lib/debt";
import { BalanceSheet } from "@/lib/balances";

interface Props {
  participants: { id: string; name: string }[];
  balances: Record<string, BalanceSheet>;
}

export default function SettlementsCard({ participants, balances }: Props) {
  const settlements = useMemo(() => {
    const balanceMap: Record<string, number> = {};
    for (const [id, sheet] of Object.entries(balances)) {
      // ✅ Используем итоговый баланс, который уже включает депозиты
      balanceMap[id] = sheet.balance;
    }
    return calculateSettlements(balanceMap);
  }, [balances]);

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
      {settlements.length === 0 ? (
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