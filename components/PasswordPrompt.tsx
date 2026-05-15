'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { storePassword } from '@/lib/client-auth';

export function PasswordPrompt({
  roomId,
  onSuccess,
  inline,
}: {
  roomId: string;
  onSuccess: () => void;
  inline?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch(`/api/v1/rooms/${roomId}`, {
      headers: { Authorization: `Basic ${btoa(`admin:${password}`)}` },
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

  const content = (
    <form onSubmit={handleSubmit} className="form-row">
      <div className="password-field" style={{ flex: 1, minWidth: 200 }}>
        <Lock className="icon" style={{ color: 'var(--text-muted)' }} />
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="Пароль"
          autoFocus
        />
        <button type="button" className="password-toggle" onClick={() => setShow(!show)}>
          {show ? <EyeOff className="icon" /> : <Eye className="icon" />}
        </button>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Проверка...' : 'Разблокировать'}
      </button>
    </form>
  );

  if (inline) {
    return (
      <div>
        {content}
        {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem', marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Комната защищена</h2>
        <p className="modal-text">Введите пароль для доступа</p>
        {content}
        {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem', marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
