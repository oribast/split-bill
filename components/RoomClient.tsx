'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Wallet, Users, Receipt, Loader2, RefreshCw } from 'lucide-react';
import { storeEditKey, getAuthHeaders } from '@/lib/client-auth';
import { ParticipantList } from './ParticipantList';
import { AddParticipantForm } from './AddParticipantForm';
import { SharedExpenseForm } from './SharedExpenseForm';
import { IndividualExpenseForm } from './IndividualExpenseForm';
import { ExpenseHistory } from './ExpenseHistory';
import { ClearRoomButton } from './ClearRoomButton';
import { PasswordPrompt } from './PasswordPrompt';
import { ThemeToggle } from './ThemeToggle';
import { Skeleton } from './Skeleton';

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
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Загрузка комнаты...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-red-500 font-medium mb-4">Не удалось загрузить комнату</p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{room.name || roomName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {currency} · {room.participants?.length ?? 0} участников · {room.events?.length ?? 0} трат
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              Админ
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" /> Участники
              </h3>
              <AddParticipantForm roomId={roomId} onAdd={() => mutate()} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" /> Новая трата
              </h3>
              <SharedExpenseForm roomId={roomId} participants={room.participants} editKey={editKey} onAdd={() => mutate()} />
              <div className="border-t border-slate-100 dark:border-slate-800" />
              <IndividualExpenseForm roomId={roomId} participants={room.participants} editKey={editKey} onAdd={() => mutate()} />
            </div>

            <ClearRoomButton roomId={roomId} editKey={editKey} onClear={() => mutate()} />
          </div>
        )}
      </div>
    </div>
  );
}
