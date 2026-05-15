'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { User, Receipt } from 'lucide-react';
import { splitIndividual } from '@/lib/split';
import { individualExpenseSchema } from '@/lib/validations';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = { id: string; name: string };

export function IndividualExpenseForm({ roomId, participants, editKey, onAdd }: { roomId: string; participants: Participant[]; editKey: string; onAdd: () => void }) {
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
    const parsed = individualExpenseSchema.safeParse({ name, amount: parseFloat(amount), payerId, participantIds: selectedIds });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders(editKey), 'X-Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ name: parsed.data.name, totalAmount: Math.round(parsed.data.amount * 100), payerId: parsed.data.payerId, participantIds: parsed.data.participantIds }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Личная трата добавлена');
      setName(''); setAmount(''); setPayerId(''); setSelectedIds([]); onAdd();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Ошибка');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <User className="w-4 h-4 text-indigo-500" /> Личная трата
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
      <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
      <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all">
        <option value="">Кто платил</option>
        {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        {participants.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            {p.name}
          </label>
        ))}
      </div>
      {preview.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-xs space-y-1 border border-indigo-100 dark:border-indigo-800">
          <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Распределение</p>
          {preview.map((entry) => {
            const person = participants.find((x) => x.id === entry.participantId);
            return <div key={entry.participantId} className="flex justify-between text-slate-800 dark:text-slate-200"><span>{person?.name}</span><span>заплатил: {(entry.amount / 100).toFixed(2)}, доля: {(entry.share / 100).toFixed(2)}</span></div>;
          })}
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
        {loading ? 'Сохранение...' : 'Добавить'}
      </button>
    </form>
  );
}
