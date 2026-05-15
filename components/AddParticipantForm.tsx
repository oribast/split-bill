'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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
    <form onSubmit={handleSubmit} className="form-row" style={{ marginBottom: 16 }}>
      <div className="form-group">
        <label>Имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Алексей"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        Добавить
      </button>
    </form>
  );
}
