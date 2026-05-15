'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/client-auth';

export function ClearRoomButton({
  roomId,
  onClear,
}: {
  roomId: string;
  onClear: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleClear() {
    const res = await fetch(`/api/v1/rooms/${roomId}/expenses`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ confirm: true }),
    });

    if (res.ok) {
      toast.success('Все траты удалены');
      setConfirming(false);
      onClear();
    } else {
      toast.error('Ошибка удаления трат');
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
      >
        Очистить все траты
      </button>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 space-y-4">
      <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
        Внимание: все траты будут безвозвратно удалены. Это действие нельзя отменить.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all active:scale-[0.98]"
        >
          Подтвердить удаление
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
