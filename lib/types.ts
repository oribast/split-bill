// lib/types.ts
export interface Participant { 
  id: string; 
  name: string; 
  participantKey?: string;
}

export interface EventEntry { 
  participantId: string; 
  amount: number; 
}

export interface Event { 
  id: string; 
  description: string; 
  amount: number; 
  type: 'shared' | 'individual'; 
  payerId: string;
  targetParticipantId?: string;
  isReverted: boolean;
  createdAt: string | Date;
  revertedAt?: string | Date | null;
  entries: EventEntry[];
  payer?: { id: string; name: string } | null; // ✅ Добавили id
  targetParticipant?: { id: string; name: string } | null;
}

export interface Room {
  id: string;
  name: string;
  editKey?: string;
  passwordHash?: string | null;
  createdAt?: string | Date;
  participants: Participant[];
  events: Event[];
}