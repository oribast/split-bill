'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Lock, LockOpen, ClipboardCopy, Loader2, RefreshCw } from 'lucide-react';
import { storeEditKey, getAuthHeaders } from '@/lib/client-auth';
import { ThemeToggle } from './ThemeToggle';
import { AddParticipantForm } from './AddParticipantForm';
import { SharedExpenseForm } from './SharedExpenseForm';
import { IndividualExpenseForm } from './IndividualExpenseForm';
import { ExpenseHistory } from './ExpenseHistory';
import { ClearRoomButton } from './ClearRoomButton';
import { PasswordPrompt } from './PasswordPrompt';

const fetcher = (url: string, editKey: string) =>
  fetch(url, { headers: getAuthHeaders(editKey) }).then((r) => {
    if (r.status === 401) throw new Error('Unauthorized');
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export function RoomClient({
  roomId,
  editKey,
  isAdmin,
  roomName,
  currency,
  hasPassword,
}: {
  roomId: string;
  editKey: string;
  isAdmin: boolean;
  roomName: string;
  currency: string;
  hasPassword: boolean;
}) {
  useEffect(() => {
    if (editKey) storeEditKey(editKey);
  }, [editKey]);

  const { data: room, error, isLoading, mutate } = useSWR(
    [`/api/v1/rooms/${roomId}`, editKey],
    ([url, key]) => fetcher(url, key),
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );

  const { data: balances } = useSWR(
    room ? [`/api/v1/rooms/${roomId}/balance`, editKey] : null,
    ([url, key]) => fetcher(url, key)
  );

  const isLocked = hasPassword && !isAdmin && !editKey;

  if (error?.message === 'Unauthorized' && hasPassword && !room) {
    return <PasswordPrompt roomId={roomId} onSuccess={() => mutate()} />;
  }

  if (isLoading && !room) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-muted)' }}>
        <Loader2 className="icon" style={{ width: 32, height: 32, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        <p>Загрузка комнаты...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--accent-danger)', fontWeight: 500, marginBottom: 16 }}>Не удалось загрузить комнату</p>
        <button className="btn-secondary" onClick={() => mutate()}>
          <RefreshCw className="icon" /> Попробовать снова
        </button>
      </div>
    );
  }

  const participants = room.participants || [];
  const events = room.events || [];

  const balanceMap = new Map(
    (balances || []).map((b: any) => [b.participantId, b])
  );

  const enriched = participants.map((p: any) => ({
    ...p,
    ...(balanceMap.get(p.id) || { paid: 0, share: 0, net: 0 }),
  }));

  const total = enriched.reduce((sum: number, p: any) => sum + (p.net || 0), 0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Ссылка скопирована'))
      .catch(() => toast.error('Не удалось скопировать'));
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h1>Комната: {room.name || roomName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          {hasPassword && (
            <button className={isAdmin ? 'btn-secondary btn-small' : 'btn-small'} style={{ background: isAdmin ? undefined : '#f6ad55', color: isAdmin ? undefined : 'white' }}>
              {isAdmin ? <><LockOpen className="icon" /> Открыто</> : <><Lock className="icon" /> Заблокировано</>}
            </button>
          )}
          <button className="btn-secondary btn-small" onClick={copyLink}>
            <ClipboardCopy className="icon" /> Ссылка
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="card unlock-card">
          <h3 className="unlock-title"><Lock className="icon" /> Введите пароль комнаты</h3>
          <PasswordPrompt roomId={roomId} onSuccess={() => mutate()} inline />
        </div>
      )}

      <div className="card">
        <h2>Участники</h2>
        {isAdmin && <AddParticipantForm roomId={roomId} onAdd={() => mutate()} />}
        {participants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">Пока нет участников</div>
            <div className="empty-subtitle">Добавьте первого, чтобы начать делить счёт</div>
          </div>
        ) : (
          <div className="participants-list" style={{ marginTop: 16 }}>
            {enriched.map((p: any) => (
              <div key={p.id} className="participant-item">
                <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                <span className={`participant-amount ${(p.net || 0) >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                  {(p.net || 0) >= 0 ? '+' : ''}{((p.net || 0) / 100).toFixed(2)} {currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && participants.length > 0 && (
        <>
          <div className="card">
            <h2>Личная трата</h2>
            <IndividualExpenseForm roomId={roomId} participants={participants} editKey={editKey} onAdd={() => mutate()} currency={currency} />
          </div>

          <div className="card">
            <h2>Общая трата</h2>
            <SharedExpenseForm roomId={roomId} participants={participants} editKey={editKey} onAdd={() => mutate()} currency={currency} />
          </div>
        </>
      )}

      {participants.length > 0 && (
        <div className="card">
          <h2>Итого</h2>
          {enriched.map((p: any) => (
            <div key={p.id} className="total-row">
              <span>{p.name}</span>
              <span className={(p.net || 0) >= 0 ? 'balance-positive' : 'balance-negative'}>
                {(p.net || 0) >= 0 ? '+' : ''}{((p.net || 0) / 100).toFixed(2)} {currency}
              </span>
            </div>
          ))}
          <div className="total-row">
            <span>Общий баланс</span>
            <span>{(Math.abs(total) / 100).toFixed(2)} {currency}</span>
          </div>
        </div>
      )}

      <div className="card">
        <h2>История операций</h2>
        <ExpenseHistory
          roomId={roomId}
          events={events}
          participants={participants}
          currency={currency}
          isAdmin={isAdmin}
          editKey={editKey}
          onRevert={() => mutate()}
        />
      </div>

      {isAdmin && <ClearRoomButton roomId={roomId} editKey={editKey} onClear={() => mutate()} />}
    </div>
  );
}
