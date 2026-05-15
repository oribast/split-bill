'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { storePassword } from '@/lib/client-auth';

export function PasswordPrompt({
  roomId,
  onSuccess,
}: {
  roomId: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch(`/api/v1/rooms/${roomId}`, {
      headers: {
        Authorization: `Basic ${btoa(`admin:${password}`)}`,
      },
    });

    if (res.ok) {
      storePassword(password);
      toast.success('Вход выполнен');
      onSuccess();
    } else {
      setError('Неверный пароль');
      toast.error('Неверный пароль');
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Введите пароль комнаты
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Комната защищена паролем
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
