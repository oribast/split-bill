'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { splitIndividual } from '@/lib/split';
import { individualExpenseSchema } from '@/lib/validations';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = { id: string; name: string };

export function IndividualExpenseForm({
  roomId,
  participants,
  editKey,
  onAdd,
}: {
  roomId: string;
  participants: Participant[];
  editKey: string;
  onAdd: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalAmount = Math.round(parseFloat(amount) * 100);
  const preview = totalAmount > 0 && payerId && selectedIds.length > 0 ? splitIndividual(payerId, selectedIds, totalAmount) : [];

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = individualExpenseSchema.safeParse({
      name,
      amount: parseFloat(amount),
      payerId,
      participantIds: selectedIds,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(editKey),
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        name: parsed.data.name,
        totalAmount: Math.round(parsed.data.amount * 100),
        payerId: parsed.data.payerId,
        participantIds: parsed.data.participantIds,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Личная трата добавлена');
      setName('');
      setAmount('');
      setPayerId('');
      setSelectedIds([]);
      onAdd();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Ошибка');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-3 flex">
      <div className="flex items-center gap-2 text-small font-semibold">
        <User className="w-4 h-4 text-primary" /> Личная трата
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" className="input" />
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Сумма"
        className="input"
      />
      <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="input select">
        <option value="">Кто платил</option>
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="checkbox-grid">
        {participants.map((p) => (
          <label key={p.id} className="checkbox-item">
            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} />
            {p.name}
          </label>
        ))}
      </div>
      {preview.length > 0 && (
        <div className="preview-box">
          <p className="preview-box-title">Распределение</p>
          {preview.map((entry) => {
            const person = participants.find((x) => x.id === entry.participantId);
            return (
              <div key={entry.participantId} className="flex-between text-small">
                <span>{person?.name}</span>
                <span>
                  заплатил: {(entry.amount / 100).toFixed(2)}, доля: {(entry.share / 100).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Сохранение...' : 'Добавить личную трату'}
      </button>
    </form>
  );
}
