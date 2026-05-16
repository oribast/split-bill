"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Room, Participant, Event } from '@/lib/types';
import { calculateBalances } from '@/lib/calculations';
import * as Api from '@/lib/api';

// Форматирование денег
const formatMoney = (val: number) => (val / 100).toFixed(2) + ' ₽';

export default function RoomClient({ initialData, roomId }: { initialData: Room, roomId: string }) {
  const router = useRouter();
  
  // Состояние данных
  const [room, setRoom] = useState<Room>(initialData);
  const [loading, setLoading] = useState(false); // Для действий (кнопки)
  const [fetching, setFetching] = useState(false); // Для загрузки комнаты
  const [error, setError] = useState('');

  // Тема
  const [theme, setTheme] = useState('light');

  // Пароль
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Формы
  const [newName, setNewName] = useState('');
  
  // Individual
  const [indId, setIndId] = useState('');
  const [indAmount, setIndAmount] = useState('');
  const [indPayer, setIndPayer] = useState('');
  const [indNote, setIndNote] = useState(''); // Для описания

  // Shared
  const [sharedAmount, setSharedAmount] = useState('');
  const [sharedPayer, setSharedPayer] = useState('');
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [sharedNote, setSharedNote] = useState(''); // Для описания

  // Инициализация темы
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(t);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // Загрузка свежих данных
  const refresh = useCallback(async () => {
    setFetching(true);
    try {
      const data = await Api.fetchRoom(roomId);
      setRoom(data);
      setError('');
    } catch (e: any) {
      if (e.message === 'auth_required') {
        setError('Нужен пароль');
        setShowUnlock(true);
      } else {
        setError('Комната не найдена');
      }
    } finally {
      setFetching(false);
    }
  }, [roomId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUnlock = async () => {
    setLoading(true);
    setUnlockError('');
    const success = await Api.unlockRoom(roomId, unlockPwd);
    setLoading(false);
    if (success) {
      setShowUnlock(false);
      refresh();
    } else {
      setUnlockError('Неверный пароль');
    }
  };

  // --- Действия ---

  const addParticipantAction = async () => {
    const name = newName.trim() || `Участник ${room.participants.length + 1}`;
    setLoading(true);
    try {
      const p = await Api.addParticipant(roomId, name);
      setRoom(prev => ({ ...prev, participants: [...prev.participants, p] }));
      setNewName('');
    } catch (e) { alert('Ошибка'); }
    finally { setLoading(false); }
  };

  const removeParticipantAction = async (pid: string) => {
    if (!confirm('Удалить участника?')) return;
    setLoading(true);
    try {
      await Api.deleteParticipant(roomId, pid);
      setRoom(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== pid)
      }));
      // Очистка селектов
      if (indId === pid) setIndId('');
      if (indPayer === pid) setIndPayer('');
      if (sharedPayer === pid) setSharedPayer('');
      setSharedIds(prev => prev.filter(id => id !== pid));
    } catch (e) { alert('Ошибка (нельзя удалить последнего?)'); }
    finally { setLoading(false); }
  };

  const handleIndividual = async () => {
    if (!indId || !indAmount || !indPayer) return alert('Заполните поля');
    const amount = parseFloat(indAmount) * 100;
    if (amount <= 0) return alert('Сумма должна быть > 0');

    setLoading(true);
    try {
      await Api.addExpense(roomId, {
        description: `Начислено ${indAmount} ₽ (${indNote || ''})`,
        amount,
        payerId: indPayer,
        targetParticipantId: indId,
      }, 'individual');
      
      setIndAmount(''); setIndNote(''); setIndId('');
      refresh();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleShared = async () => {
    if (!sharedAmount || sharedIds.length === 0 || !sharedPayer) return alert('Заполните поля');
    const amount = parseFloat(sharedAmount) * 100;
    
    setLoading(true);
    try {
      await Api.addExpense(roomId, {
        description: `Общее: ${sharedAmount} ₽ (${sharedNote || ''})`,
        amount,
        payerId: sharedPayer,
        participantIds: sharedIds,
      }, 'shared');

      setSharedAmount(''); setSharedNote(''); setSharedIds([]);
      refresh();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleRevert = async (eventId: string) => {
    if (!confirm('Откатить трату?')) return;
    setLoading(true);
    try {
      await Api.revertEvent(roomId, eventId);
      refresh();
    } catch (e) { alert('Ошибка'); }
    finally { setLoading(false); }
  };

  // --- Вычисления ---
  const balances = calculateBalances(room.participants, room.events);
  const totalDebt = Object.values(balances).reduce((a, b) => a + b, 0); // Должно быть 0, если все посчитано верно, но здесь это "сколько должны вернуть"

  // Превью шаринга
  const sharedPreview = (() => {
    if (!sharedAmount || sharedIds.length === 0) return null;
    const total = parseFloat(sharedAmount) * 100;
    const count = sharedIds.length;
    const base = Math.floor(total / count);
    let rem = total % count;
    return sharedIds.map(id => {
      const add = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
      const p = room.participants.find(x => x.id === id);
      return { name: p?.name || '?', val: add / 100 };
    });
  })();

  // --- Рендер ---
  if (error === 'Комната не найдена') {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Комната не найдена</h1>
        <button onClick={() => router.push('/')} className="btn btn-primary">На главную</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">{room.name || 'Загрузка...'}</h1>
          <p className="text-muted text-sm font-mono">{roomId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleTheme} className="btn btn-secondary btn-small" title="Сменить тему">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={refresh} className="btn btn-secondary btn-small" disabled={fetching}>
            {fetching ? '...' : '↻'}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Скопировано'); }} className="btn btn-secondary btn-small">
            🔗
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      {showUnlock && (
        <div className="card border-l-4 border-l-accent-danger bg-yellow-50 dark:bg-yellow-900/20">
          <h3 className="font-bold text-lg mb-2">Комната защищена</h3>
          <div className="flex gap-2">
            <input 
              className="input" 
              type="password" 
              placeholder="Пароль" 
              value={unlockPwd} 
              onChange={e => setUnlockPwd(e.target.value)} 
            />
            <button onClick={handleUnlock} disabled={loading} className="btn btn-primary">
              Войти
            </button>
          </div>
          {unlockError && <p className="text-accent-danger mt-2 text-sm">{unlockError}</p>}
        </div>
      )}

      {!fetching && !showUnlock && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Участники и балансы */}
          <section className="card">
            <h2 className="text-lg font-bold mb-4 text-secondary border-b border-border pb-2">Балансы</h2>
            
            {/* Список */}
            <div className="space-y-2 mb-6">
              {room.participants.map(p => {
                const bal = balances[p.id] || 0;
                const color = bal > 0 ? 'text-green-500' : bal < 0 ? 'text-red-500' : 'text-muted';
                return (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-item rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <button 
                        onClick={() => removeParticipantAction(p.id)}
                        className="text-muted hover:text-accent-danger text-xs px-1"
                        title="Удалить"
                      >✕</button>
                    </div>
                    <span className={`font-mono font-bold ${color}`}>{(bal/100).toFixed(2)} ₽</span>
                  </div>
                );
              })}
            </div>

            {/* Добавление */}
            <div className="flex gap-2">
              <input 
                className="input" 
                placeholder="Новый участник" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && addParticipantAction()}
              />
              <button onClick={addParticipantAction} disabled={loading} className="btn btn-primary">+</button>
            </div>
          </section>

          {/* 2. Индивидуальная трата */}
          <section className="card">
            <h2 className="text-lg font-bold mb-4 text-secondary border-b border-border pb-2">Начислить лично</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Кому</label>
                  <select className="input" value={indId} onChange={e => setIndId(e.target.value)}>
                    <option value="">Выберите...</option>
                    {room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Плательщик</label>
                  <select className="input" value={indPayer} onChange={e => setIndPayer(e.target.value)}>
                    <option value="">Выберите...</option>
                    {room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Сумма (₽)</label>
                <input 
                  type="number" className="input" placeholder="0.00" 
                  value={indAmount} onChange={e => setIndAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="form-label">Комментарий</label>
                <input className="input" placeholder="Например: Такси" value={indNote} onChange={e => setIndNote(e.target.value)} />
              </div>
              <button onClick={handleIndividual} disabled={loading || !indId} className="btn btn-primary w-full mt-2">
                Начислить
              </button>
            </div>
          </section>

          {/* 3. Общая трата */}
          <section className="card col-span-1 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 text-secondary border-b border-border pb-2">Раскидать сумму</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Сумма (₽)</label>
                  <input 
                    type="number" className="input" placeholder="0.00" 
                    value={sharedAmount} onChange={e => setSharedAmount(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="form-label">Плательщик</label>
                  <select className="input" value={sharedPayer} onChange={e => setSharedPayer(e.target.value)}>
                    <option value="">Выберите...</option>
                    {room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Комментарий</label>
                  <input className="input" placeholder="Общий ужин" value={sharedNote} onChange={e => setSharedNote(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSharedIds(room.participants.map(p => p.id))} className="btn btn-secondary btn-small">Все</button>
                  <button onClick={() => setSharedIds([])} className="btn btn-secondary btn-small">Никто</button>
                </div>
              </div>

              <div>
                <label className="form-label">Кого включить</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-item rounded border border-border">
                  {room.participants.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={sharedIds.includes(p.id)} 
                        onChange={e => {
                          if(e.target.checked) setSharedIds([...sharedIds, p.id]);
                          else setSharedIds(sharedIds.filter(id => id !== p.id));
                        }}
                        className="rounded text-accent focus:ring-accent"
                      />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>

                {sharedPreview && (
                  <div className="mt-4 p-3 bg-preview border border-border rounded text-sm">
                    <div className="font-bold mb-1">Итого каждому:</div>
                    {sharedPreview.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-mono">{item.val.toFixed(2)} ₽</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={handleShared} 
                  disabled={loading || sharedIds.length === 0} 
                  className="btn btn-primary w-full mt-4"
                >
                  Распределить
                </button>
              </div>
            </div>
          </section>

          {/* 4. История */}
          <section className="card col-span-1 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 text-secondary">История операций</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {room.events.length === 0 && <p className="text-muted text-center py-4">Пока пусто</p>}
              {room.events.map(ev => (
                <div key={ev.id} className={`p-4 rounded border border-border bg-card flex justify-between items-start ${ev.isReverted ? 'opacity-50' : ''}`}>
                  <div>
                    <div className="font-bold text-primary">{ev.description}</div>
                    <div className="text-xs text-muted mt-1">
                      {new Date(ev.createdAt).toLocaleString()} • {ev.type === 'shared' ? 'Общее' : 'Личное'}
                      <span className="ml-2">Платил: {ev.payer?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{(ev.amount/100).toFixed(2)} ₽</div>
                    {!ev.isReverted && (
                      <button onClick={() => handleRevert(ev.id)} className="text-xs text-accent-danger hover:underline mt-1">
                        Отмена
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}