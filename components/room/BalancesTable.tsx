"use client";
import { BalanceSheet } from "@/lib/balances";

interface Props {
  participants: { id: string; name: string }[];
  balances: Record<string, BalanceSheet>;
  roomStatus: "open" | "closed";
}

const fmt = (cents: number) => (cents / 100).toFixed(2) + ' ₽';

export default function BalancesTable({ participants, balances, roomStatus }: Props) {
  const isClosed = roomStatus === "closed";

  return (
    <div className="card" style={{ padding: '16px', overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Балансы участников</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)`, color: 'var(--text-muted)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Участник</th>
            {isClosed && <th style={{ padding: '8px', textAlign: 'right' }}>Внёс</th>}
            {isClosed && <th style={{ padding: '8px', textAlign: 'right' }}>Получил</th>}
            {isClosed && <th style={{ padding: '8px', textAlign: 'right' }}>Остаток</th>}
            <th style={{ padding: '8px', textAlign: 'right' }}>Потратил</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Потребил</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Баланс</th>
          </tr>
        </thead>
        <tbody>
          {participants.map(p => {
            const b = balances[p.id] || { deposited: 0, received: 0, cashOnHand: 0, spent: 0, consumed: 0, balance: 0 };
            const balColor = b.balance > 0 ? 'var(--accent-success, #22c55e)' : b.balance < 0 ? 'var(--accent-danger, #ef4444)' : 'var(--text-muted)';
            return (
              <tr key={p.id} style={{ borderBottom: `1px solid var(--border)` }}>
                <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{p.name}</td>
                {isClosed && <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.deposited)}</td>}
                {isClosed && <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.received)}</td>}
                {isClosed && <td style={{ padding: '8px', textAlign: 'right', color: b.cashOnHand > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>{fmt(b.cashOnHand)}</td>}
                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.spent)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(b.consumed)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: balColor }}>{fmt(b.balance)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!isClosed && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '10px 0 0', textAlign: 'center' }}>
          Депозиты будут учтены в итоговом балансе после закрытия комнаты.
        </p>
      )}
    </div>
  );
}