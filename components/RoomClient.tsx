'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { storeEditKey, getAuthHeaders, isAdmin } from '@/lib/client-auth';
import { ParticipantList } from './ParticipantList';
import { AddParticipantForm } from './AddParticipantForm';
import { SharedExpenseForm } from './SharedExpenseForm';
import { IndividualExpenseForm } from './IndividualExpenseForm';
import { ExpenseHistory } from './ExpenseHistory';
import { ClearRoomButton } from './ClearRoomButton';
import { PasswordPrompt } from './PasswordPrompt';
import { ThemeToggle } from './ThemeToggle';
import { Skeleton } from './Skeleton';

const fetcher = (url: string) =>
  fetch(url, { headers: getAuthHeaders() }).then((r) => {
    if (r.status === 401) throw new Error('Unauthorized');
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export function RoomClient({
  roomId,
  initialEditKey,
  hasPassword,
  roomName,
  currency,
  realEditKey,
}: {
  roomId: string;
  initialEditKey: string;
  hasPassword: boolean;
  roomName: string;
  currency: string;
  realEditKey: string;
}) {
  useEffect(() => {
    if (initialEditKey) storeEditKey(initialEditKey);
  }, [initialEditKey]);

  const { data: room, error, isLoading, mutate } = useSWR(
    `/api/v1/rooms/${roomId}`,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    if (error?.message === 'Unauthorized' && hasPassword) {
      setShowPasswordPrompt(true);
    } else if (error) {
      toast.error('Ошибка загрузки комнаты');
    }
  }, [error, hasPassword]);

  const handleAuthSuccess = () => {
    setShowPasswordPrompt(false);
    mutate();
    toast.success('Вход выполнен');
  };

  const admin = isAdmin();

  if (isLoading && !room) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{roomName}</h1>
          <ThemeToggle />
        </div>
        <Skeleton count={4} />
      </div>
    );
  }

  if (!room && showPasswordPrompt) {
    return <PasswordPrompt roomId={roomId} onSuccess={handleAuthSuccess} />;
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Ошибка загрузки комнаты</p>
        <button
          onClick={() => mutate()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>Валюта: {currency}</span>
              <span>·</span>
              <span>{room.participants?.length ?? 0} участников</span>
              <span>·</span>
              <span>{room.events?.length ?? 0} трат</span>
              {admin && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Админ</span>
                </>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <ParticipantList
        participants={room.participants}
        currency={currency}
        isLoading={isLoading}
      />

      {admin && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <AddParticipantForm roomId={roomId} onAdd={mutate} />
          </div>
          <SharedExpenseForm
            roomId={roomId}
            participants={room.participants}
            onAdd={mutate}
          />
          <IndividualExpenseForm
            roomId={roomId}
            participants={room.participants}
            onAdd={mutate}
          />
          <div className="md:col-span-2">
            <ClearRoomButton roomId={roomId} onClear={mutate} />
          </div>
        </div>
      )}

      <ExpenseHistory
        roomId={roomId}
        events={room.events}
        participants={room.participants}
        currency={currency}
        isAdmin={admin}
        onRevert={mutate}
      />
    </div>
  );
}
