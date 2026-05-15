'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { addParticipantSchema } from '@/lib/validations';

export function AddParticipantForm({ roomId, onAdd }: { roomId: string; onAdd: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addParticipantSchema.safeParse({ name });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Участник добавлен');
      setName('');
      onAdd();
    } else {
      toast.error('Ошибка добавления');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя"
        className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
      </button>
    </form>
  );
}
