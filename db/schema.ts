import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  timestamp,
  jsonb,
  serial,
  boolean,
} from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().notNull(),
  name: text('name').notNull(),
  editKey: varchar('edit_key', { length: 36 }).notNull(),
  passwordHash: text('password_hash'),
  currency: varchar('currency', { length: 3 }).notNull().default('RUB'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().notNull(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  participantKey: varchar('participant_key', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().notNull(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
  createdBy: uuid('created_by').references(() => participants.id, { onDelete: 'set null' }),
  isReverted: boolean('is_reverted').notNull().default(false),
  revertedAt: timestamp('reverted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventEntries = pgTable('event_entries', {
  id: uuid('id').primaryKey().notNull(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  share: bigint('share', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').primaryKey().notNull(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 36 }).notNull().unique(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(sql`now() + interval '24 hours'`),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  payload: jsonb('payload'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(participants),
  events: many(events),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  room: one(rooms, { fields: [participants.roomId], references: [rooms.id] }),
  eventEntries: many(eventEntries),
  createdEvents: many(events, { relationName: 'createdBy' }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  room: one(rooms, { fields: [events.roomId], references: [rooms.id] }),
  creator: one(participants, { fields: [events.createdBy], references: [participants.id] }),
  entries: many(eventEntries),
}));

export const eventEntriesRelations = relations(eventEntries, ({ one }) => ({
  event: one(events, { fields: [eventEntries.eventId], references: [events.id] }),
  participant: one(participants, { fields: [eventEntries.participantId], references: [participants.id] }),
}));
