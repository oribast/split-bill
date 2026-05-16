import { pgTable, uuid, varchar, bigint, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Вспомогательная функция для UUID с автогенерацией
// Важно: uuid() требует имя колонки!
const uuidPk = (name: string) => uuid(name).primaryKey().defaultRandom();

export const rooms = pgTable('rooms', {
  id: uuidPk('id'), 
  name: varchar('name', { length: 255 }).notNull(),
  editKey: uuid('edit_key').notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const participants = pgTable('participants', {
  id: uuidPk('id'), 
  roomId: uuid('room_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  participantKey: uuid('participant_key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuidPk('id'), 
  roomId: uuid('room_id').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  type: varchar('type', { enum: ['shared', 'individual'] }).notNull(),
  payerId: uuid('payer_id').references(() => participants.id, { onDelete: 'set null' }),
  targetParticipantId: uuid('target_participant_id').references(() => participants.id, { onDelete: 'set null' }),
  isReverted: boolean('is_reverted').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revertedAt: timestamp('reverted_at', { withTimezone: true }),
});

export const eventEntries = pgTable('event_entries', {
  id: uuidPk('id'), 
  eventId: uuid('event_id').notNull(),
  participantId: uuid('participant_id').references(() => participants.id, { onDelete: 'set null' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
  key: varchar('key', { length: 255 }).primaryKey(),
  eventId: uuid('event_id'),
  expiresAt: timestamp('expires_at').notNull(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(participants),
  events: many(events),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  room: one(rooms, { fields: [participants.roomId], references: [rooms.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  room: one(rooms, { fields: [events.roomId], references: [rooms.id] }),
  payer: one(participants, { fields: [events.payerId], references: [participants.id] }),
  targetParticipant: one(participants, { fields: [events.targetParticipantId], references: [participants.id] }),
  entries: many(eventEntries),
}));

export const eventEntriesRelations = relations(eventEntries, ({ one }) => ({
  event: one(events, { fields: [eventEntries.eventId], references: [events.id] }),
  participant: one(participants, { fields: [eventEntries.participantId], references: [participants.id] }),
}));