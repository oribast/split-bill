// Типы данных, приходящих с бэкенда
interface Participant { id: string; name: string; }
interface EventEntry { participantId: string; amount: number; }
interface Event { 
  id: string; 
  amount: number; 
  payerId: string; 
  isReverted: boolean; 
  entries: EventEntry[]; 
}

interface BalanceMap {
  [participantId: string]: number;
}

export function calculateBalances(participants: Participant[], events: Event[]): BalanceMap {
  const balances: BalanceMap = {};
  
  // Инициализация нулями
  participants.forEach(p => balances[p.id] = 0);

  events.forEach(event => {
    if (event.isReverted) return;

    // Платец "дал" деньги системе (плюс ему)
    // Сумма траты
    const totalAmount = event.amount;
    
    // Платец заплатил полную сумму, значит он "в плюсе" на эту сумму относительно своих долей
    // Но проще считать так:
    // 1. Платец внес +Amount в общий котел.
    // 2. Каждый участник (включая плательщика) забрал из котла свою долю (entries).
    
    // Добавляем платеж плательщику
    if (balances[event.payerId] !== undefined) {
      balances[event.payerId] += totalAmount;
    }

    // Вычитаем доли участников
    event.entries.forEach(entry => {
      if (balances[entry.participantId] !== undefined) {
        balances[entry.participantId] -= entry.amount;
      }
    });
  });

  return balances;
}