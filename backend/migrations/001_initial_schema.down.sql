DROP INDEX IF EXISTS idx_rooms_code;
DROP INDEX IF EXISTS idx_log_room;
DROP INDEX IF EXISTS idx_cards_player;
DROP INDEX IF EXISTS idx_players_room;

DROP TABLE IF EXISTS game_log;
DROP TABLE IF EXISTS player_cards;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS rooms;

DROP TYPE IF EXISTS card_type;
DROP TYPE IF EXISTS room_status;
