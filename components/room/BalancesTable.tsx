"use client";
import { BalanceSheet } from "@/lib/balances";

interface Props {
  participants: { id: string; name: string }[];
  balances: Record<string, BalanceSheet>;
}

const fmt = (cents: number) => (cents / 100).toFixed(2) + ' ₽';

export default function BalancesTable({ participants, balances }: Props) {
  return (
    <div className="card" style={{ padding: '16px', overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Балансы участников</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)`, color: 'var(--text-muted)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Участник</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Внесено</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Потрачено</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Баланс</th>
          </tr>
        </thead>
        <tbody>
          {participants.map(p => {
            const b = balances[p.id] || { paidIn: 0, spent: 0, balance: 0 };
            const balColor = b.balance > 0 ? 'var(--accent-success, #22c55e)' : b.balance < 0 ? 'var(--accent-danger, #ef4444)' : 'var(--text-muted)';
            return (
              <tr key={p.id} style={{ borderBottom: `1px solid var(--border)` }}>
                <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{p.name}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.paidIn)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.spent)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: balColor }}>{fmt(b.balance)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}