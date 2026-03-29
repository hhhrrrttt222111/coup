-- ==========================================================================
-- Coup Card Game — Consolidated Schema (Supabase-compatible)
-- ==========================================================================
-- Run this against a fresh Supabase database to create all tables.
-- Usage: npx tsx scripts/migrate.ts
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE room_status AS ENUM ('waiting', 'in_progress', 'finished', 'abandoned');
CREATE TYPE card_type   AS ENUM ('Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador');

-- -------------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------------

CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(6) UNIQUE NOT NULL,
    status      room_status NOT NULL DEFAULT 'waiting',
    max_players INT NOT NULL DEFAULT 6,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE players (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name      VARCHAR(30) NOT NULL,
    coins     INT NOT NULL DEFAULT 2,
    is_alive  BOOLEAN NOT NULL DEFAULT TRUE,
    socket_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_cards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    card        card_type NOT NULL,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE game_log (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    actor_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    target_id  UUID REFERENCES players(id) ON DELETE SET NULL,
    result     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------------------

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_player_cards_player_id ON player_cards(player_id);
CREATE INDEX idx_game_log_room_id ON game_log(room_id);

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full_access" ON rooms FOR ALL USING (true);
CREATE POLICY "service_full_access" ON players FOR ALL USING (true);
CREATE POLICY "service_full_access" ON player_cards FOR ALL USING (true);
CREATE POLICY "service_full_access" ON game_log FOR ALL USING (true);
