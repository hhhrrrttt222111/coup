-- Reverse Supabase compatibility changes

DROP POLICY IF EXISTS "service_full_access" ON game_log;
DROP POLICY IF EXISTS "service_full_access" ON player_cards;
DROP POLICY IF EXISTS "service_full_access" ON players;
DROP POLICY IF EXISTS "service_full_access" ON rooms;

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_log DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_players_room_id;
DROP INDEX IF EXISTS idx_player_cards_player_id;
DROP INDEX IF EXISTS idx_game_log_room_id;

CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_cards_player ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_log_room ON game_log(room_id);

ALTER TABLE player_cards DROP COLUMN IF EXISTS created_at;
ALTER TABLE players DROP COLUMN IF EXISTS created_at;
