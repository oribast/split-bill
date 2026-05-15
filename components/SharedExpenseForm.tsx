'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { splitEqual } from '@/lib/split';
import { sharedExpenseSchema } from '@/lib/validations';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = { id: string; name: string };

export function SharedExpenseForm({
  roomId,
  participants,
  editKey,
  onAdd,
  currency,
}: {
  roomId: string;
  participants: Participant[];
  editKey: string;
  onAdd: () => void;
  currency: string;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalAmount = Math.round(parseFloat(amount) * 100);
  const preview = totalAmount > 0 && selectedIds.length > 0 ? splitEqual(totalAmount, selectedIds) : [];

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const selectAll = () => setSelectedIds(participants.map((p) => p.id));
  const deselectAll = () => setSelectedIds([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = sharedExpenseSchema.safeParse({
      name, amount: parseFloat(amount), participantIds: selectedIds,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(editKey),
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        name: parsed.data.name,
        totalAmount: Math.round(parsed.data.amount * 100),
        participantIds: parsed.data.participantIds,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Общая трата добавлена');
      setName(''); setAmount(''); setSelectedIds([]);
      onAdd();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Ошибка');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-3 flex">
      <div className="form-row">
        <div className="form-group">
          <label>Сумма для распределения</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`0.00 ${currency}`} />
        </div>
        <div className="form-group">
          <label>Примечание</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, ужин в ресторане" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <button type="button" className="btn-secondary btn-small" onClick={selectAll}>Выбрать всех</button>
        <button type="button" className="btn-secondary btn-small" onClick={deselectAll}>Снять всех</button>
      </div>

      <div className="checkbox-grid">
        {participants.map((p) => (
          <label key={p.id} className="checkbox-item">
            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} />
            <span>{p.name}</span>
          </label>
        ))}
      </div>

      {preview.length > 0 && (
        <div className="preview-box">
          <div className="preview-title">Предпросмотр распределения:</div>
          {preview.map((entry) => {
            const person = participants.find((x) => x.id === entry.participantId);
            return (
              <div key={entry.participantId} className="preview-row">
                <span>{person?.name}</span>
                <span>+{(entry.share / 100).toFixed(2)} {currency}</span>
              </div>
            );
          })}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading || selectedIds.length === 0}>
        {loading ? 'Сохранение...' : `Распределить поровну (${selectedIds.length} чел.)`}
      </button>
    </form>
  );
}
