'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Wallet, Users, Receipt, Loader2, RefreshCw } from 'lucide-react';
import { storeEditKey, getAuthHeaders } from '@/lib/client-auth';
import { ParticipantList } from '../components/ParticipantList';
import { AddParticipantForm } from '../components/AddParticipantForm';
import { SharedExpenseForm } from '../components/SharedExpenseForm';
import { IndividualExpenseForm } from '../components/IndividualExpenseForm';
import { ExpenseHistory } from '../components/ExpenseHistory';
import { ClearRoomButton } from '../components/ClearRoomButton';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { ThemeToggle } from '../components/ThemeToggle';
import { Skeleton } from '../components/Skeleton';

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

  if (error?.message === 'Unauthorized' && hasPassword && !room) {
    return <PasswordPrompt roomId={roomId} onSuccess={() => mutate()} />;
  }

  if (isLoading && !room) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20 text-muted">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Загрузка комнаты...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-danger font-medium mb-4">Не удалось загрузить комнату</p>
        <button onClick={() => mutate()} className="btn btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" /> Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card flex-between mb-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-primary-soft text-primary shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{room.name || roomName}</h1>
            <p className="text-small text-muted mt-1">
              {currency} · {room.participants?.length ?? 0} участников · {room.events?.length ?? 0} трат
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <span className="badge badge-success">Админ</span>}
          <ThemeToggle />
        </div>
      </div>

      <div className="grid-layout">
        <div className="main-content">
          <ParticipantList participants={room.participants} currency={currency} isLoading={isLoading} />
          <ExpenseHistory
            roomId={roomId}
            events={room.events}
            participants={room.participants}
            currency={currency}
            isAdmin={isAdmin}
            editKey={editKey}
            onRevert={() => mutate()}
          />
        </div>

        {isAdmin && (
          <div className="sidebar">
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-small">
                <Users className="w-4 h-4 text-muted" /> Участники
              </h3>
              <AddParticipantForm roomId={roomId} onAdd={() => mutate()} />
            </div>

            <div className="card flex-col gap-4 flex">
              <h3 className="font-semibold flex items-center gap-2 text-small">
                <Receipt className="w-4 h-4 text-muted" /> Новая трата
              </h3>
              <SharedExpenseForm roomId={roomId} participants={room.participants} editKey={editKey} onAdd={() => mutate()} />
              <div className="divider" />
              <IndividualExpenseForm roomId={roomId} participants={room.participants} editKey={editKey} onAdd={() => mutate()} />
            </div>

            <ClearRoomButton roomId={roomId} editKey={editKey} onClear={() => mutate()} />
          </div>
        )}
      </div>
    </div>
  );
}
