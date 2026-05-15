'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { getAuthHeaders } from '@/lib/client-auth';

export function ClearRoomButton({ roomId, editKey, onClear }: { roomId: string; editKey: string; onClear: () => void }) {
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
      <button onClick={() => setConfirming(true)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]">
        <Trash2 className="w-4 h-4" /> Очистить все траты
      </button>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">Все траты будут безвозвратно удалены. Это необратимо.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={handleClear} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]">Удалить всё</button>
        <button onClick={() => setConfirming(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]">Отмена</button>
      </div>
    </div>
  );
}
