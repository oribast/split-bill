// lib/types.ts

export interface Participant { 
  id: string; 
  name: string; 
  participantKey?: string;
  roomId?: string;
  createdAt?: Date | string;
}

export interface EventEntry { 
  id?: string;
  eventId?: string;
  participantId: string; 
  amount: number; 
}

export interface Event { 
  id: string; 
  roomId?: string;
  description: string; 
  amount: number; 
  type: 'shared' | 'individual'; 
  payerId: string;
  targetParticipantId: string | null; // ✅ Drizzle возвращает null, не undefined
  isReverted: boolean;
  createdAt: Date | string; // ✅ Drizzle возвращает Date
  revertedAt: Date | string | null;
  entries: EventEntry[];
  payer?: { id: string; name: string } | null;
  targetParticipant?: { id: string; name: string } | null;
}

export interface Room {
  id: string;
  name: string;
  editKey?: string;
  passwordHash?: string | null;
  createdAt?: Date | string;
  participants: Participant[];
  events: Event[];
}