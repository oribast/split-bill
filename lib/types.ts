import { InferSelectModel } from 'drizzle-orm';
import { rooms, participants, events, eventEntries } from '@/db/schema';

export type Room = InferSelectModel<typeof rooms>;
export type Participant = InferSelectModel<typeof participants>;
export type Event = InferSelectModel<typeof events>;
export type EventEntry = InferSelectModel<typeof eventEntries>;

export type RoomWithRelations = Room & {
  participants: Participant[];
  events: (Event & {
    entries: EventEntry[];
    payer: Participant | null;
    targetParticipant: Participant | null;
  })[];
};