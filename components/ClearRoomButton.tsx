'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { getAuthHeaders } from '@/lib/client-auth';

export function ClearRoomButton({
  roomId,
  editKey,
  onClear,
}: {
  roomId: string;
  editKey: string;
  onClear: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleClear() {
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders(editKey) },
      body: JSON.stringify({ confirm: true }),
    });
    if (res.ok) {
      toast.success('Все траты удалены');
      setConfirming(false);
      onClear();
    } else {
      toast.error('Ошибка удаления');
    }
  }

  if (!confirming) {
    return (
      <div className="actions">
        <button className="btn-danger" onClick={() => setConfirming(true)}>
          <Trash2 className="icon" /> Очистить всё
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: 'var(--accent-danger)', background: 'var(--accent-danger-soft)' }}>
      <div className="flex-col gap-4 flex">
        <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
          <AlertTriangle className="icon" style={{ color: 'var(--accent-danger)', marginTop: 2 }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--accent-danger)' }}>
            Все траты будут безвозвратно удалены. Это необратимо.
          </p>
        </div>
        <div className="form-row">
          <button className="btn-danger" onClick={handleClear}>Удалить всё</button>
          <button className="btn-secondary" onClick={() => setConfirming(false)}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
