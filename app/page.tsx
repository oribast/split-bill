"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { IconLock, IconEye, IconEyeOff, IconPlus, IconLink, IconUsers, IconSun, IconMoon } from '@/components/Icons';
import { useTheme } from '@/hooks/use-theme';

import CreatedRoomScreen from "@/components/room/CreatedRoomScreen";

// ✅ Внутренний компонент, использующий useSearchParams
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, mounted } = useTheme();

  const [roomName, setRoomName] = useState('');
  const [joinQuery, setJoinQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; url: string; code: string; hasPassword: boolean } | null>(null);

  // ✅ Обработка ?code= при загрузке
  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      fetch(`/api/v1/rooms/lookup?q=${encodeURIComponent(code)}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => router.push(`/room/${data.roomId}`))
        .catch(() => {
          toast.error('Комната по этому коду не найдена');
          router.push('/');
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams, router]);

  const createRoom = async () => {
    const name = roomName.trim() || 'Новая комната';
    setLoading(true); setError('');
    try {
      const body: any = { name };
      if (usePassword && password.trim()) body.password = password.trim();
      const res = await fetch('/api/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Ошибка создания');
      const data = await res.json();
      if (data.room?.id && data.editKey && data.inviteCode) {
        if (typeof window !== "undefined") localStorage.setItem(`editKey_${data.room.id}`, data.editKey);
        const url = `${window.location.origin}/room/${data.room.id}?editKey=${data.editKey}`;
        setCreated({ 
          id: data.room.id, 
          url, 
          code: data.inviteCode, 
          hasPassword: usePassword && password.trim().length > 0 
        });
      } else { setError('Ошибка создания комнаты'); }
    } catch { setError('Ошибка сети'); } finally { setLoading(false); }
  };

  const joinRoom = async () => {
    const q = joinQuery.trim();
    if (!q) return setError('Введите ID или код приглашения');
    setLoading(true); setError('');
    try {
      if (/^[0-9a-f-]{36}$/i.test(q)) { router.push(`/room/${q}`); return; }
      const res = await fetch(`/api/v1/rooms/lookup?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('not_found');
      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message === 'not_found' ? 'Комната не найдена. Проверьте код.' : 'Ошибка сети');
    } finally { setLoading(false); }
  };

  const copyLink = () => { if (created) navigator.clipboard.writeText(created.url).then(() => toast.success('Ссылка скопирована')); };
  const copyCode = () => { if (created) navigator.clipboard.writeText(created.code).then(() => toast.success('Код скопирован')); };

    if (created) {
    return (
      <CreatedRoomScreen
        roomId={created.id}
        inviteCode={created.code}
        adminLink={created.url}
        hasPassword={created.hasPassword}
        onOpenRoom={() => router.push(`/room/${created.id}`)}
      />
    );
  }

  return (
    <div className="container relative" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {mounted && (
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-lg border bg-card hover:bg-secondary transition" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
          {theme === 'light' ? <IconMoon className="w-5 h-5" /> : <IconSun className="w-5 h-5" />}
        </button>
      )}
      <h1 style={{ fontSize: '2.75rem', marginBottom: '8px', fontWeight: 800, letterSpacing: '-0.02em' }}>Tally</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.125rem' }}>Умный раздел расходов без лишних сложностей</p>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto 24px', padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Название комнаты (необязательно)" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', marginBottom: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'var(--bg-secondary)', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => { setUsePassword(!usePassword); if (usePassword) { setPassword(''); setShowPassword(false); } }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}><IconLock className="w-4 h-4" /> Защитить паролем</span>
              <div style={{ position: 'relative', width: '40px', height: '22px', borderRadius: '11px', background: usePassword ? 'var(--accent-primary)' : 'var(--border)', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', left: usePassword ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
              </div>
            </div>
            {usePassword && (
              <div style={{ marginTop: '12px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><IconLock className="w-4 h-4" /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Придумайте пароль" style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px', paddingBlock: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }} title={showPassword ? 'Скрыть' : 'Показать'}>
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
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
          <input type="text" value={joinQuery} onChange={(e) => setJoinQuery(e.target.value)} placeholder="ID или код приглашения" onKeyDown={(e) => e.key === 'Enter' && joinRoom()} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
          <button className="btn-primary" onClick={joinRoom} disabled={loading}>Войти</button>
        </div>
      </div>
    </div>
  );
}

// ✅ Обёртка с Suspense (требование Next.js для useSearchParams)
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}