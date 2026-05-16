"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const createRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const body: any = { name: 'Новая комната' };
      if (usePassword && password.trim()) body.password = password.trim();
      
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Ошибка создания');
      const data = await res.json();
      
      if (data.room?.id) {
        sessionStorage.setItem(`editKey_${data.room.id}`, data.editKey);
        if (usePassword && password.trim()) {
          sessionStorage.setItem(`password_${data.room.id}`, btoa(password.trim()));
        }
        router.push(`/room/${data.room.id}`);
      } else {
        setError('Ошибка создания комнаты');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    const id = roomId.trim();
    if (id) router.push(`/room/${id}`);
    else setError('Введите ID комнаты');
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Split Bill</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.125rem' }}>
        Создай комнату для разделения счёта и поделись ссылкой
      </p>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={usePassword} onChange={(e) => {
              setUsePassword(e.target.checked);
              if (!e.target.checked) { setPassword(''); setShowPassword(false); }
            }} />
            Защитить комнату паролем
          </label>
          {usePassword && (
            <div className="password-field" style={{ marginTop: '12px' }}>
              <span className="icon">🔒</span>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Придумайте пароль" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Скрыть' : 'Показать'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          )}
        </div>
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '12px', fontSize: '0.875rem' }}>{error}</p>}
        <button className="btn-primary" onClick={createRoom} disabled={loading || (usePassword && !password.trim())} style={{ width: '100%', padding: '16px', fontSize: '1.125rem' }}>
          {loading ? 'Создание...' : 'Создать новую комнату'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Или войти по ID комнаты</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Например: a3f9k2" onKeyDown={(e) => e.key === 'Enter' && joinRoom()} style={{ flex: 1 }} />
          <button className="btn-primary" onClick={joinRoom}>Войти</button>
        </div>
      </div>
    </div>
  );
}