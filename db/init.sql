-- Включаем расширение для генерации UUID (если не включено)
-- В Neon/PostgreSQL 14+ функция gen_random_uuid() доступна по умолчанию,
-- но на всякий случай создаем расширение, если используется uuid-ossp
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица комнат
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    edit_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Таблица участников
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    participant_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Таблица трат (событий)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL, -- Сумма в копейках
    type VARCHAR(20) NOT NULL CHECK (type IN ('shared', 'individual')),
    payer_id UUID NOT NULL REFERENCES participants(id),
    target_participant_id UUID REFERENCES participants(id),
    is_reverted BOOLEAN DEFAULT FALSE NOT NULL,
    reverted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Таблица записей о долях в трате
CREATE TABLE IF NOT EXISTS event_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id),
    amount BIGINT NOT NULL -- Доля в копейках
);

-- Таблица для идемпотентности запросов
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_events_room_id ON events(room_id);
CREATE INDEX IF NOT EXISTS idx_events_payer_id ON events(payer_id);
CREATE INDEX IF NOT EXISTS idx_event_entries_event_id ON event_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_event_entries_participant_id ON event_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_keys(expires_at);

-- Очистка старых ключей идемпотентности (можно запускать вручную или настроить cron)
-- DELETE FROM idempotency_keys WHERE expires_at < NOW();