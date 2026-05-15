'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, ArrowRight } from 'lucide-react';
import { storePassword } from '@/lib/client-auth';

export function PasswordPrompt({ roomId, onSuccess }: { roomId: string; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: { Authorization: `Basic ${btoa(`admin:${password}`)}` } });
    if (res.ok) {
      storePassword(password);
      toast.success('Вход выполнен');
      onSuccess();
    } else {
      toast.error('Неверный пароль');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Комната защищена</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Введите пароль для доступа</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Проверка...' : <><span>Войти</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
