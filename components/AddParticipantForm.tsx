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
        placeholder="Имя нового участника"
        className="input flex-1"
      />
      <button type="submit" disabled={loading} className="btn btn-primary px-3">
        <UserPlus className="w-4 h-4" />
      </button>
    </form>
  );
}
