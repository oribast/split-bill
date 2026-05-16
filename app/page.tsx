"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { IconLock, IconEye, IconEyeOff, IconPlus, IconLink, IconUsers, IconSun, IconMoon } from '@/components/Icons';
import { useTheme } from '@/hooks/use-theme';

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const [roomName, setRoomName] = useState('');
  const [joinQuery, setJoinQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; url: string; code: string } | null>(null);

  const createRoom = async () => {
    const name = roomName.trim() || 'Новая комната';
    setLoading(true);
    setError('');
    try {
      const body: any = { name };
      if (usePassword && password.trim()) body.password = password.trim();
      
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Ошибка создания');
      const data = await res.json();
      
      if (data.room?.id && data.editKey && data.inviteCode) {
        const url = `${window.location.origin}/room/${data.room.id}?editKey=${data.editKey}`;
        setCreated({ id: data.room.id, url, code: data.inviteCode });
      } else {
        setError('Ошибка создания комнаты');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    const q = joinQuery.trim();
    if (!q) return setError('Введите ID или код приглашения');
    setLoading(true);
    setError('');
    try {
      if (/^[0-9a-f-]{36}$/i.test(q)) {
        router.push(`/room/${q}`);
        return;
      }
      const res = await fetch(`/api/v1/rooms/lookup?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('not_found');
      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message === 'not_found' ? 'Комната не найдена. Проверьте код.' : 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (created) navigator.clipboard.writeText(created.url).then(() => toast.success('Ссылка скопирована'));
  };

  const copyCode = () => {
    if (created) navigator.clipboard.writeText(created.code).then(() => toast.success('Код скопирован'));
  };

  if (created) {
    return (
      <div className="container relative" style={{ textAlign: 'center', paddingTop: '80px' }}>
        {mounted && (
          <button 
            onClick={toggleTheme} 
            className="absolute top-4 right-4 p-2 rounded-lg border border-border bg-background hover:bg-secondary transition"
            title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? <IconMoon className="w-5 h-5" /> : <IconSun className="w-5 h-5" />}
          </button>
        )}

        <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Комната создана!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Отправьте ссылку или код приглашения участникам.
        </p>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto 24px', padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Код приглашения</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary, #f3f4f6)', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', flex: 1 }}>{created.code}</span>
              <button onClick={copyCode} className="btn-secondary btn-small flex items-center gap-1">
                <IconLink className="w-4 h-4" /> Копировать
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Прямая ссылка (с ключом админа)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-secondary, #f3f4f6)', borderRadius: '8px', wordBreak: 'break-all' }}>
              <IconLink className="w-4 h-4 flex-shrink-0 text-muted" />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', flex: 1 }}>{created.url}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={copyLink}>
              <IconLink className="w-4 h-4 inline mr-1" /> Копировать ссылку
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => router.push(`/room/${created.id}`)}>
              Открыть комнату
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {mounted && (
        <button 
          onClick={toggleTheme} 
          className="absolute top-4 right-4 p-2 rounded-lg border border-border bg-background hover:bg-secondary transition"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? <IconMoon className="w-5 h-5" /> : <IconSun className="w-5 h-5" />}
        </button>
      )}

      <h1 style={{ fontSize: '2.75rem', marginBottom: '8px', fontWeight: 800, letterSpacing: '-0.02em' }}>Tally</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.125rem' }}>
        Умный раздел расходов без лишних сложностей
      </p>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto 24px', padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Название комнаты (необязательно)"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', marginBottom: '12px', color: 'var(--text-primary)' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={usePassword} 
              onChange={(e) => {
                setUsePassword(e.target.checked);
                if (!e.target.checked) { setPassword(''); setShowPassword(false); }
              }}
              style={{ accentColor: 'var(--accent-primary, #3b82f6)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <IconLock className="w-4 h-4" /> Защитить паролем
          </label>
          {usePassword && (
            <div style={{ marginTop: '12px', position: 'relative' }}>
              <IconLock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Придумайте пароль"
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px', paddingBlock: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Скрыть' : 'Показать'}
              >
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '12px', fontSize: '0.875rem' }}>{error}</p>}
        <button className="btn-primary" onClick={createRoom} disabled={loading || (usePassword && !password.trim())} style={{ width: '100%', padding: '14px', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <IconPlus className="w-5 h-5" /> {loading ? 'Создание...' : 'Создать комнату'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <IconUsers className="w-4 h-4" /> Войти в комнату
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={joinQuery}
            onChange={(e) => setJoinQuery(e.target.value)}
            placeholder="ID или код приглашения"
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
          <button className="btn-primary" onClick={joinRoom} disabled={loading}>Войти</button>
        </div>
      </div>
    </div>
  );
}