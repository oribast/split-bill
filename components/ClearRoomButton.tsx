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
      <button onClick={() => setConfirming(true)} className="btn btn-ghost w-full text-danger border-danger/20 hover:bg-danger-soft">
        <Trash2 className="w-4 h-4" /> Очистить все траты
      </button>
    );
  }

  return (
    <div className="card border-danger/30 bg-danger-soft">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <p className="text-small text-danger font-medium">
          Все траты будут безвозвратно удалены. Это необратимо.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={handleClear} className="btn btn-danger flex-1">
          Удалить всё
        </button>
        <button onClick={() => setConfirming(false)} className="btn btn-secondary flex-1">
          Отмена
        </button>
      </div>
    </div>
  );
}
