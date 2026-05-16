"use client";
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { calculateBalances, Participant, Event, BalanceMap } from '@/lib/calculations';

export interface Room {
  id: string;
  name: string;
  editKey?: string;
  passwordHash?: string | null;
  createdAt?: Date | string;
  participants: Participant[];
  events: Event[];
}

// Безопасный конструктор URL для API
const getApiUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${base}${path}`;
};

const fetcher = async (url: string) => {
  const res = await fetch(getApiUrl(url));
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
};

export default function RoomClient({
  initialData,
  roomId,
}: {
  initialData: Room;
  roomId: string;
}) {
  const { data: roomData, mutate, error: swrError } = useSWR<{ room: Room }>(
    `/api/v1/rooms/${roomId}`,
    fetcher,
    {
      fallbackData: { room: initialData },
      refreshInterval: 5000,
      revalidateOnFocus: false, // Отключаем лишние ревалидации
    }
  );

  const room = roomData?.room || initialData;
  const [editKey, setEditKey] = useState<string | null>(null);
  const [myParticipantKey, setMyParticipantKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  // Forms State
  const [newParticipantName, setNewParticipantName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [targetParticipant, setTargetParticipant] = useState('');
  const [expenseType, setExpenseType] = useState<'shared' | 'individual'>('shared');

  useEffect(() => {
    const storedEditKey = sessionStorage.getItem(`editKey_${roomId}`);
    const storedPartKey = sessionStorage.getItem(`participantKey_${roomId}`);
    if (storedEditKey) setEditKey(storedEditKey);
    if (storedPartKey) setMyParticipantKey(storedPartKey);
  }, [roomId]);

  const getHeaders = () => {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (editKey) h['x-edit-key'] = editKey;
    if (myParticipantKey) h['x-participant-key'] = myParticipantKey;
    return h;
  };

  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newParticipantName.trim()) return;
    
    try {
      const res = await fetch(getApiUrl(`/api/v1/rooms/${roomId}/participants`), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newParticipantName }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add participant');
      }
      
      const data = await res.json();
      sessionStorage.setItem(`participantKey_${roomId}`, data.participantKey);
      setMyParticipantKey(data.participantKey);
      setNewParticipantName('');
      mutate();
    } catch (err: any) {
      console.error('Add participant error:', err);
      setFormError(err.message || 'Ошибка добавления участника');
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const amountValue = parseFloat(expenseAmount);
    if (!amountValue || amountValue <= 0 || !selectedPayer) {
      setFormError('Заполните все обязательные поля');
      return;
    }
    
    const amountKopecks = Math.round(amountValue * 100);
    const endpoint = expenseType === 'shared' ? 'shared' : 'individual';
    
    const body: any = {
      description: expenseDesc.trim(),
      amount: amountKopecks,
      payerId: selectedPayer,
    };

    if (expenseType === 'shared') {
      if (selectedParticipants.length === 0) {
        setFormError('Выберите хотя бы одного участника');
        return;
      }
      body.participantIds = selectedParticipants;
    } else {
      if (!targetParticipant) {
        setFormError('Выберите должника');
        return;
      }
      body.targetParticipantId = targetParticipant;
    }

    try {
      const res = await fetch(getApiUrl(`/api/v1/rooms/${roomId}/expenses/${endpoint}`), {
        method: 'POST',
        headers: { 
          ...getHeaders(), 
          'X-Idempotency-Key': crypto.randomUUID() 
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create expense');
      }
      
      // Reset form
      setExpenseDesc('');
      setExpenseAmount('');
      setSelectedParticipants([]);
      setTargetParticipant('');
      mutate();
    } catch (err: any) {
      console.error('Add expense error:', err);
      setFormError(err.message || 'Ошибка создания траты');
    }
  };

  const revertEvent = async (eventId: string) => {
    if (!confirm('Отменить эту трату?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/v1/rooms/${roomId}/events/${eventId}`), {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to revert');
      mutate();
    } catch (err) {
      console.error('Revert error:', err);
      alert('Не удалось отменить трату');
    }
  };

  if (!room) return <div className="p-10">Loading...</div>;

  const balances: BalanceMap = calculateBalances(room.participants, room.events);

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="text-sm text-gray-500">ID: {room.id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate(undefined, { revalidate: true })}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Обновить
          </button>
        </div>
      </header>

      {formError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {formError}
          <button 
            className="ml-2 text-sm underline"
            onClick={() => setFormError('')}
          >
            Закрыть
          </button>
        </div>
      )}

      {swrError && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
          Ошибка загрузки: {(swrError as Error).message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Participants & Balances */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Балансы</h2>
          <ul className="space-y-3 mb-6">
            {room.participants.map((p: Participant) => {
              const bal = balances[p.id] || 0;
              const color = bal > 0 ? 'text-green-600' : bal < 0 ? 'text-red-500' : 'text-gray-600';
              return (
                <li key={p.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="font-medium">{p.name}</span>
                  <span className={`font-mono font-bold ${color}`}>
                    {(bal / 100).toFixed(2)} ₽
                  </span>
                </li>
              );
            })}
          </ul>

          {editKey && (
            <form onSubmit={addParticipant} className="mt-4 pt-4 border-t dark:border-gray-700">
              <h3 className="text-sm font-bold mb-2 uppercase text-gray-500">Добавить участника</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                  placeholder="Имя"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+</button>
              </div>
            </form>
          )}
        </section>

        {/* Add Expense */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Новая трата</h2>
          <form onSubmit={addExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Описание</label>
              <input
                required
                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Сумма (₽)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Кто платил</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
              >
                <option value="">Выберите...</option>
                {room.participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setExpenseType('shared')}
                className={`flex-1 py-1 text-sm rounded ${expenseType === 'shared' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
                На всех
              </button>
              <button type="button" onClick={() => setExpenseType('individual')}
                className={`flex-1 py-1 text-sm rounded ${expenseType === 'individual' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
                Конкретному лицу
              </button>
            </div>

            {expenseType === 'shared' ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">На кого делим</label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 dark:border-gray-600 space-y-1">
                  {room.participants.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedParticipants.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedParticipants([...selectedParticipants, p.id]);
                          else setSelectedParticipants(selectedParticipants.filter(id => id !== p.id));
                        }} />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Должник</label>
                <select className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                  value={targetParticipant} onChange={(e) => setTargetParticipant(e.target.value)}>
                  <option value="">Выберите...</option>
                  {room.participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium">
              Добавить трату
            </button>
          </form>
        </section>

        {/* History */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">История</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {room.events.length === 0 && <p className="text-gray-500 text-sm">Нет трат</p>}
            {room.events.map((ev) => (
              <div key={ev.id} className={`p-3 rounded border ${ev.isReverted ? 'bg-gray-100 dark:bg-gray-900 opacity-50 border-gray-200' : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{ev.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ev.type === 'shared' ? 'Общая' : 'Личная'} • {new Date(ev.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Платил: {ev.payer?.name || 'Unknown'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{(ev.amount / 100).toFixed(2)} ₽</div>
                    {ev.isReverted && <span className="text-xs text-red-500 block">Отменено</span>}
                  </div>
                </div>
                {!ev.isReverted && editKey && (
                  <button onClick={() => revertEvent(ev.id)} className="mt-2 text-xs text-red-500 hover:underline">
                    Отменить трату
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}