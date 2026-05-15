'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { addParticipantSchema } from '@/lib/validations';

export function AddParticipantForm({
  roomId,
  onAdd,
}: {
  roomId: string;
  onAdd: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = addParticipantSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      toast.success('Участник добавлен');
      setName('');
      onAdd();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Ошибка добавления участника');
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <div className="flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя нового участника"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        Добавить
      </button>
    </form>
  );
}
