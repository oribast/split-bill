"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/lib/api'; // Мы создадим этот файл ниже

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const body: any = {};
      if (usePassword) body.password = password;
      
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Ошибка создания');
      const data = await res.json();

      // Сохраняем ключ админа (editKey)
      sessionStorage.setItem(`editKey_${data.room.id}`, data.editKey);
      // Если был пароль, сохраняем и его
      if (usePassword && password) {
        sessionStorage.setItem(`password_${data.room.id}`, btoa(password)); // Base64 для Basic Auth
      }
      
      router.push(`/room/${data.room.id}`);
    } catch (e) {
      setError('Не удалось создать комнату');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4 text-primary">Split Bill</h1>
      <p className="text-secondary mb-12 text-lg">Создай комнату для разделения счёта</p>

      <div className="card">
        <div className="mb-4 text-left">
          <label className="flex items-center gap-2 cursor-pointer text-secondary justify-center select-none">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              checked={usePassword} 
              onChange={(e) => { setUsePassword(e.target.checked); if (!e.target.checked) setPassword(''); }} 
            />
            Защитить паролем
          </label>
          
          {usePassword && (
            <div className="mt-3 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Придумайте пароль"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2.5 text-muted hover:text-primary"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-accent-danger mb-3 text-sm">{error}</p>}

        <button 
          className="btn btn-primary w-full text-lg py-3"
          onClick={handleCreate}
          disabled={loading || (usePassword && !password)}
        >
          {loading ? 'Создание...' : 'Создать новую комнату'}
        </button>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wide">Или войти по ссылке</h2>
        <p className="text-muted text-sm mb-4">Если у вас есть ссылка на комнату, просто перейдите по ней. Создание новой комнаты выше.</p>
      </div>
    </div>
  );
}