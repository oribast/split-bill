// lib/calculations.ts
import { Participant, Event } from './types'; // ✅ Импорт из единого файла

export interface BalanceMap {
  [participantId: string]: number;
}

export function calculateBalances(participants: Participant[], events: Event[]): BalanceMap {
  const balances: BalanceMap = {};
  
  // Инициализация нулями
  participants.forEach(p => balances[p.id] = 0);

  events.forEach(event => {
    if (event.isReverted) return;

    // Платец внёс всю сумму в "котёл"
    if (balances[event.payerId] !== undefined) {
      balances[event.payerId] += event.amount;
    }

    // Участники забрали свои доли
    event.entries.forEach(entry => {
      if (balances[entry.participantId] !== undefined) {
        balances[entry.participantId] -= entry.amount;
      }
    });
  });

  return balances;
}