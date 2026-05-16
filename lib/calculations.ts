export interface Participant { 
  id: string; 
  name: string; 
}

export interface EventEntry { 
  participantId: string; 
  amount: number; 
}

export interface Event { 
  id: string; 
  description: string; 
  amount: number; 
  type: string; 
  payerId: string;
  payer?: { name: string }; 
  isReverted: boolean;
  entries: EventEntry[]; 
  createdAt: string;
}

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
    } else {
      balances[event.payerId] = (balances[event.payerId] || 0) + event.amount;
    }

    event.entries.forEach(entry => {
      if (balances[entry.participantId] !== undefined) {
        balances[entry.participantId] -= entry.amount;
      } else {
        balances[entry.participantId] = (balances[entry.participantId] || 0) - entry.amount;
      }
    });
  });

  return balances;
}