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
  entries: EventEntry[];
  payer?: { name: string };
}

export interface Room {
  id: string;
  name: string;
  editKey?: string;
  participants: Participant[];
  events: Event[];
}