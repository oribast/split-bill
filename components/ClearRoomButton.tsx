'use client';

import { useState } from 'react';
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
      setConfirming(false);
      onClear();
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full bg-rose-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-700"
      >
        Очистить все траты
      </button>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-3">
      <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
        Внимание: все траты будут безвозвратно удалены. Это действие нельзя отменить.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-700"
        >
          Подтвердить удаление
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
