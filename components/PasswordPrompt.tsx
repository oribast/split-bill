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
    const res = await fetch(`/api/v1/rooms/${roomId}`, {
      headers: { Authorization: `Basic ${btoa(`admin:${password}`)}` },
    });
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
    <div className="modal-overlay">
      <div className="modal">
        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="modal-title">Комната защищена</h2>
        <p className="modal-text">Введите пароль для доступа</p>
        <form onSubmit={handleSubmit} className="flex-col gap-4 flex">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="input"
          />
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Проверка...' : <><span>Войти</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
