export interface Participant {
  id: string;
  roomId: string;
  name: string;
  participantKey: string;
  createdAt: Date;
}

export interface EventEntry {
  id: string;
  eventId: string;
  participantId: string;
  amount: number;
}

export interface Event {
  id: string;
  roomId: string;
  description: string;
  amount: number;
  type: 'shared' | 'individual';
  payerId: string | null;
  targetParticipantId: string | null;
  isReverted: boolean;
  revertedAt: Date | null;
  createdAt: Date;
}

export interface EventWithRelations extends Event {
  entries: EventEntry[];
  payer: Pick<Participant, 'id' | 'name'> | null;
  targetParticipant: Pick<Participant, 'id' | 'name'> | null;
}

export interface Room {
  id: string;
  name: string;
  editKey: string;
  passwordHash: string | null;
  inviteCode: string;
  status: "open" | "closed"; // ✅ Добавлено
  createdAt: Date;
}

export interface RoomWithRelations extends Room {
  participants: Participant[];
  events: EventWithRelations[];
  deposits: { 
    id: string; 
    participantId: string; 
    amount: number; 
    isAdvance: boolean; 
    note: string | null; 
    createdAt: Date 
  }[];
}