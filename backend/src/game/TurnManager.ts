import { AppError } from '../types';

export class TurnManager {
  private readonly order: readonly string[];
  private readonly eliminated: Set<string>;
  private currentIndex: number;

  constructor(playerIds: readonly string[]) {
    if (playerIds.length < 2) {
      throw new AppError('Need at least 2 players', 'INSUFFICIENT_PLAYERS');
    }
    this.order = [...playerIds];
    this.eliminated = new Set();
    this.currentIndex = 0;
  }

  /** Return the player id whose turn it currently is. */
  getCurrentPlayer(): string {
    return this.order[this.currentIndex];
  }

  /**
   * Advance to the next alive player and return their id.
   * Wraps around the turn order, skipping eliminated players.
   */
  nextTurn(): string {
    const alive = this.getAlivePlayers();
    if (alive.length === 0) {
      throw new AppError('No alive players remain', 'NO_ALIVE_PLAYERS');
    }

    do {
      this.currentIndex = (this.currentIndex + 1) % this.order.length;
    } while (this.eliminated.has(this.order[this.currentIndex]));

    return this.order[this.currentIndex];
  }

  /** Mark a player as eliminated. They will be skipped in future turns. */
  markEliminated(playerId: string): void {
    this.eliminated.add(playerId);
  }

  isPlayerAlive(playerId: string): boolean {
    return !this.eliminated.has(playerId);
  }

  /** Return all non-eliminated player ids in turn order. */
  getAlivePlayers(): string[] {
    return this.order.filter((id) => !this.eliminated.has(id));
  }
}
