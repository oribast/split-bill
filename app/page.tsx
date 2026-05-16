"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password: password || null }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      
      const data = await res.json();
      
      // Сохраняем ключ админа в sessionStorage
      sessionStorage.setItem(`editKey_${data.room.id}`, data.editKey);
      
      router.push(`/room/${data.room.id}`);
    } catch (err) {
      setError('Ошибка создания комнаты');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-8">Создать комнату</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label className="block mb-2">Название</label>
          <input 
            type="text" 
            required
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-2">Пароль (опционально)</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Создать'}
        </button>
      </form>
    </main>
  );
}