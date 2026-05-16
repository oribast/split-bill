import { Event, Participant } from '@/lib/types';

export interface Finances {
  balances: Record<string, number>;
  consumed: Record<string, number>;
  paid: Record<string, number>;
}

export function calculateFinances(participants: Participant[], events: Event[]): Finances {
  const balances: Record<string, number> = {};
  const consumed: Record<string, number> = {};
  const paid: Record<string, number> = {};

  // Инициализация нулями для всех текущих участников
  participants.forEach(p => {
    balances[p.id] = 0;
    consumed[p.id] = 0;
    paid[p.id] = 0;
  });

  events.forEach(ev => {
    if (ev.isReverted) return;

    const amount = ev.amount;

    // ✅ Защита от null: если плательщик удалён, пропускаем начисление "оплачено"
    if (ev.payerId) {
      paid[ev.payerId] = (paid[ev.payerId] || 0) + amount;
      balances[ev.payerId] = (balances[ev.payerId] || 0) - amount;
    }

    // Индивидуальное начисление
    if (ev.type === 'individual' && ev.targetParticipantId) {
      consumed[ev.targetParticipantId] = (consumed[ev.targetParticipantId] || 0) + amount;
      balances[ev.targetParticipantId] = (balances[ev.targetParticipantId] || 0) + amount;
    } 
    // Групповое распределение
    else if (ev.type === 'shared' && ev.entries) {
      ev.entries.forEach(entry => {
        consumed[entry.participantId] = (consumed[entry.participantId] || 0) + entry.amount;
        balances[entry.participantId] = (balances[entry.participantId] || 0) + entry.amount;
      });
    }
  });

  return { balances, consumed, paid };
}