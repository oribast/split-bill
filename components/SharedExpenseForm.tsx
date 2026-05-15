'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { splitEqual } from '@/lib/split';
import { sharedExpenseSchema } from '@/lib/validations';
import { getAuthHeaders } from '@/lib/client-auth';

type Participant = {
  id: string;
  name: string;
};

export function SharedExpenseForm({
  roomId,
  participants,
  onAdd,
}: {
  roomId: string;
  participants: Participant[];
  onAdd: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = Math.round(parseFloat(amount) * 100);

  const preview =
    totalAmount > 0 && selectedIds.length > 0
      ? splitEqual(totalAmount, selectedIds)
      : [];

  function toggleId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = sharedExpenseSchema.safeParse({
      name,
      amount: parseFloat(amount),
      participantIds: selectedIds,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        errs[err.path[0] as string] = err.message;
      });
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        name: parsed.data.name,
        totalAmount: Math.round(parsed.data.amount * 100),
        participantIds: parsed.data.participantIds,
      }),
    });

    if (res.ok) {
      toast.success('Общая трата добавлена');
      setName('');
      setAmount('');
      setSelectedIds([]);
      onAdd();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Ошибка добавления траты');
    }

    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white">Общая трата</h3>

      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название (например, Ужин)"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {errors.name && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Сумма"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {errors.amount && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Участники:</p>
        <div className="grid grid-cols-2 gap-2">
          {participants.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggleId(p.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {p.name}
            </label>
          ))}
        </div>
        {errors.participantIds && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.participantIds}</p>
        )}
      </div>

      {preview.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm space-y-1 border border-blue-100 dark:border-blue-800">
          <p className="text-blue-700 dark:text-blue-300 font-medium text-xs uppercase tracking-wider mb-2">
            Предпросмотр распределения
          </p>
          {preview.map((entry) => {
            const person = participants.find((x) => x.id === entry.participantId);
            return (
              <div
                key={entry.participantId}
                className="flex justify-between text-gray-800 dark:text-gray-200"
              >
                <span>{person?.name}</span>
                <span className="font-medium">{(entry.share / 100).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? 'Сохранение...' : 'Добавить общую трату'}
      </button>
    </form>
  );
}
