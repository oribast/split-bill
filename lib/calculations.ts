import { Participant, Event } from './types';

export interface Finances {
  balances: Record<string, number>; // + должен, - вам должны
  consumed: Record<string, number>; // сколько потрачено на участника
  paid: Record<string, number>;     // сколько участник оплатил
}

export function calculateFinances(participants: Participant[], events: Event[]): Finances {
  const balances: Record<string, number> = {};
  const consumed: Record<string, number> = {};
  const paid: Record<string, number> = {};

  participants.forEach(p => {
    balances[p.id] = 0;
    consumed[p.id] = 0;
    paid[p.id] = 0;
  });

  events.forEach(ev => {
    if (ev.isReverted) return;
    const amount = ev.amount;

    // Плательщик внес деньги → его баланс уменьшается (ему должны)
    paid[ev.payerId] = (paid[ev.payerId] || 0) + amount;
    balances[ev.payerId] = (balances[ev.payerId] || 0) - amount;

    // Участники потребляют доли → их баланс растет (они должны)
    ev.entries.forEach(entry => {
      consumed[entry.participantId] = (consumed[entry.participantId] || 0) + entry.amount;
      balances[entry.participantId] = (balances[entry.participantId] || 0) + entry.amount;
    });
  });

  return { balances, consumed, paid };
}