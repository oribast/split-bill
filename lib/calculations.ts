// lib/calculations.ts
import { Participant, Event } from './types';

export interface BalanceMap {
  [participantId: string]: number;
}

export function calculateBalances(participants: Participant[], events: Event[]): BalanceMap {
  const balances: BalanceMap = {};
  
  participants.forEach(p => balances[p.id] = 0);

  events.forEach(event => {
    if (event.isReverted) return;

    if (balances[event.payerId] !== undefined) {
      balances[event.payerId] += event.amount;
    }

    event.entries.forEach(entry => {
      if (balances[entry.participantId] !== undefined) {
        balances[entry.participantId] -= entry.amount;
      }
    });
  });

  return balances;
}