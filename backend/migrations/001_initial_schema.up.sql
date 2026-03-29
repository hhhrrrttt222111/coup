CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE room_status AS ENUM ('waiting', 'in_progress', 'finished');
CREATE TYPE card_type   AS ENUM ('Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador');

-- Rooms
CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(6) UNIQUE NOT NULL,
    status      room_status NOT NULL DEFAULT 'waiting',
    max_players INT NOT NULL DEFAULT 6,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players
CREATE TABLE players (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name      VARCHAR(30) NOT NULL,
    coins     INT NOT NULL DEFAULT 2,
    is_alive  BOOLEAN NOT NULL DEFAULT TRUE,
    socket_id VARCHAR(50)
);

-- Player cards (each player holds up to 2)
CREATE TABLE player_cards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    card        card_type NOT NULL,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Game log
CREATE TABLE game_log (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    actor_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    target_id  UUID REFERENCES players(id) ON DELETE SET NULL,
    result     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_room  ON players(room_id);
CREATE INDEX idx_cards_player  ON player_cards(player_id);
CREATE INDEX idx_log_room      ON game_log(room_id);
CREATE INDEX idx_rooms_code    ON rooms(code);
