import 'dotenv/config';
import pool from '../config/db';

// ---------------------------------------------------------------------------
// Seed data for local development
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log('Seeding database…\n');

  await pool.query('BEGIN');

  try {
    // Clean existing data (reverse FK order)
    await pool.query('DELETE FROM game_log');
    await pool.query('DELETE FROM player_cards');
    await pool.query('DELETE FROM players');
    await pool.query('DELETE FROM rooms');

    // ---- Room 1: waiting lobby with 3 players ----
    const { rows: [room1] } = await pool.query<{ id: string }>(
      `INSERT INTO rooms (code, status, max_players)
       VALUES ('ABC123', 'waiting', 6)
       RETURNING id`,
    );

    const room1Players = ['Alice', 'Bob', 'Charlie'];
    const room1PlayerIds: string[] = [];

    for (const name of room1Players) {
      const { rows: [p] } = await pool.query<{ id: string }>(
        `INSERT INTO players (room_id, name, coins)
         VALUES ($1, $2, 2)
         RETURNING id`,
        [room1.id, name],
      );
      room1PlayerIds.push(p.id);
    }

    // Give each player 2 cards
    const cards: [string, string][] = [
      ['Duke', 'Captain'],
      ['Assassin', 'Contessa'],
      ['Ambassador', 'Duke'],
    ];

    for (let i = 0; i < room1PlayerIds.length; i++) {
      for (const card of cards[i]) {
        await pool.query(
          `INSERT INTO player_cards (player_id, card) VALUES ($1, $2)`,
          [room1PlayerIds[i], card],
        );
      }
    }

    console.log(`  ✓ Room ABC123 (waiting) — ${room1Players.length} players`);

    // ---- Room 2: in-progress game with 4 players ----
    const { rows: [room2] } = await pool.query<{ id: string }>(
      `INSERT INTO rooms (code, status, max_players)
       VALUES ('XYZ789', 'in_progress', 4)
       RETURNING id`,
    );

    const room2Players = [
      { name: 'Diana', coins: 5, alive: true },
      { name: 'Eve',   coins: 1, alive: true },
      { name: 'Frank', coins: 0, alive: false },
      { name: 'Grace', coins: 3, alive: true },
    ];

    const room2PlayerIds: string[] = [];

    for (const p of room2Players) {
      const { rows: [row] } = await pool.query<{ id: string }>(
        `INSERT INTO players (room_id, name, coins, is_alive)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [room2.id, p.name, p.coins, p.alive],
      );
      room2PlayerIds.push(row.id);
    }

    // Some game log entries
    await pool.query(
      `INSERT INTO game_log (room_id, actor_id, action, target_id, result) VALUES
       ($1, $2, 'income',      NULL, 'success'),
       ($1, $3, 'foreign_aid', NULL, 'success'),
       ($1, $4, 'coup',        $5,   'success'),
       ($1, $2, 'tax',         NULL, 'success')`,
      [room2.id, room2PlayerIds[0], room2PlayerIds[1], room2PlayerIds[2], room2PlayerIds[2]],
    );

    console.log(`  ✓ Room XYZ789 (in_progress) — ${room2Players.length} players`);

    // ---- Room 3: finished game ----
    const { rows: [room3] } = await pool.query<{ id: string }>(
      `INSERT INTO rooms (code, status, max_players)
       VALUES ('FIN001', 'finished', 2)
       RETURNING id`,
    );

    const { rows: [_winner] } = await pool.query<{ id: string }>(
      `INSERT INTO players (room_id, name, coins, is_alive)
       VALUES ($1, 'Heather', 7, true)
       RETURNING id`,
      [room3.id],
    );

    await pool.query(
      `INSERT INTO players (room_id, name, coins, is_alive)
       VALUES ($1, 'Ivan', 0, false)`,
      [room3.id],
    );

    console.log(`  ✓ Room FIN001 (finished) — winner: Heather`);

    await pool.query('COMMIT');
    console.log('\n✓ Seed complete — 3 rooms created');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
}

seed()
  .catch(() => process.exit(1))
  .finally(() => pool.end());
