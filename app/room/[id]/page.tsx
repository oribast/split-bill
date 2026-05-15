'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoomPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const key = searchParams.get('key') || '';
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/rooms/${id}`, { headers: { 'X-Edit-Key': key } })
      .then((r) => r.json())
      .then((data) => {
        setRoom(data);
        setLoading(false);
      });
  }, [id, key]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>;
  }

  if (!room || room.error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Комната не найдена</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{room.name}</h1>
          <p className="text-gray-500 text-sm">
            Валюта: {room.currency} · {room.participants?.length ?? 0} участников
          </p>
        </div>
      </div>
    </main>
  );
}
