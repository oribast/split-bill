'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { storeEditKey, getAuthHeaders, isAdmin, isAuthenticated } from '@/lib/client-auth';
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
}: {
  roomId: string;
  initialEditKey: string;
  hasPassword: boolean;
  roomName: string;
  currency: string;
}) {
  useEffect(() => {
    if (initialEditKey) storeEditKey(initialEditKey);
  }, [initialEditKey]);

  const { data: room, error, isLoading, mutate } = useSWR(
    isAuthenticated() ? `/api/v1/rooms/${roomId}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    if (error?.message === 'Unauthorized' && hasPassword) {
      setShowPasswordPrompt(true);
    }
  }, [error, hasPassword]);

  const handleAuthSuccess = () => {
    setShowPasswordPrompt(false);
    mutate();
  };

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
    return <div className="text-center py-8 text-red-500">Ошибка загрузки комнаты</div>;
  }

  const admin = isAdmin();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>Валюта: {currency}</span>
          <span>·</span>
          <span>{room.participants?.length ?? 0} участников</span>
          <span>·</span>
          <span>{room.events?.length ?? 0} трат</span>
        </div>
      </div>

      <ParticipantList
        participants={room.participants}
        currency={currency}
        isLoading={isLoading}
      />

      {admin && (
        <>
          <AddParticipantForm roomId={roomId} onAdd={mutate} />
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
          <ClearRoomButton roomId={roomId} onClear={mutate} />
        </>
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
