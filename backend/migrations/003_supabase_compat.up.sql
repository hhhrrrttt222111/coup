-- Supabase compatibility: uuid-ossp extension, created_at columns, RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add created_at to tables that don't have it
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE player_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Rename indexes to match the standard naming convention (drop old, create new)
DROP INDEX IF EXISTS idx_players_room;
DROP INDEX IF EXISTS idx_cards_player;
DROP INDEX IF EXISTS idx_log_room;

CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_player_id ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_game_log_room_id ON game_log(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_full_access' AND tablename = 'rooms') THEN
        CREATE POLICY "service_full_access" ON rooms FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_full_access' AND tablename = 'players') THEN
        CREATE POLICY "service_full_access" ON players FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_full_access' AND tablename = 'player_cards') THEN
        CREATE POLICY "service_full_access" ON player_cards FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_full_access' AND tablename = 'game_log') THEN
        CREATE POLICY "service_full_access" ON game_log FOR ALL USING (true);
    END IF;
END $$;
