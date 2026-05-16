'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { addParticipantSchema } from '@/lib/validations';

export function AddParticipantForm({ roomId, onAdd, existingCount = 0 }: { roomId: string; onAdd: () => void; existingCount?: number }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalName = name.trim();
    if (!finalName) {
      finalName = `Участник ${existingCount + 1}`;
    }

    const parsed = addParticipantSchema.safeParse({ name: finalName });
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
    <form onSubmit={handleSubmit} className="form-row" style={{ marginBottom: 16 }}>
      <div className="form-group">
        <label className="form-label">Имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Участник ${existingCount + 1}`}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        <UserPlus className="icon" /> Добавить
      </button>
    </form>
  );
}
