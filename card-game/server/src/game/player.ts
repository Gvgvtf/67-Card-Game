import { CardData } from './types';
import { Deck, combinedResult, isSpecial } from './cards';

export const INITIAL_HAND = 7;
export const MAX_HAND = 9;
export const MAX_REDRAW_CARDS = 3;

export class Player {
  name: string;
  hand: CardData[] = [];
  private deck: Deck;
  private obstacleCounters: number[] = [];
  private obstacleOwners: number[] = [];
  private obstacleGrace: number[] = [];

  constructor(name: string, sharedDeck?: Deck) {
    this.name = name;
    this.deck = sharedDeck ?? new Deck();
  }

  dealInitialHand() {
    this.hand.push(...this.deck.drawMultiple(INITIAL_HAND));
    this.syncObstacleLists();
  }

  getDeckRemaining() { return this.deck.remaining(); }

  // Obstacle management
  private syncObstacleLists() {
    while (this.obstacleCounters.length < this.hand.length) this.obstacleCounters.push(0);
    while (this.obstacleOwners.length < this.hand.length) this.obstacleOwners.push(-1);
    while (this.obstacleGrace.length < this.hand.length) this.obstacleGrace.push(0);
  }

  isObstructed(index: number): boolean {
    if (index < 0) return false;
    if (index < this.obstacleCounters.length && this.obstacleCounters[index] > 0) return true;
    if (index < this.hand.length && this.hand[index].obstacleturnsLeft > 0) return true;
    return false;
  }

  applyObstacle(targetIndex: number, turns: number, placerIndex = -1): string {
    if (targetIndex < 0 || targetIndex >= this.hand.length) return 'Invalid target.';
    this.syncObstacleLists();
    this.obstacleCounters[targetIndex] = turns;
    this.obstacleOwners[targetIndex] = placerIndex;
    this.obstacleGrace[targetIndex] = 1;
    this.hand[targetIndex].obstacleturnsLeft = turns;
    return `${this.name}'s ${this.hand[targetIndex].name} is obstructed for ${turns} turn(s).`;
  }

  tickObstacles(placerIndex: number) {
    this.syncObstacleLists();
    for (let i = 0; i < this.obstacleCounters.length; i++) {
      const v = this.obstacleCounters[i];
      const owner = this.obstacleOwners[i];
      const grace = this.obstacleGrace[i];
      if (v > 0 && (owner === -1 || owner === placerIndex)) {
        if (grace > 0) {
          this.obstacleGrace[i] = grace - 1;
          if (i < this.hand.length) this.hand[i].obstacleturnsLeft = v;
        } else {
          const newV = v - 1;
          this.obstacleCounters[i] = newV;
          if (i < this.hand.length) this.hand[i].obstacleturnsLeft = Math.max(0, newV);
          if (newV === 0) { this.obstacleOwners[i] = -1; this.obstacleGrace[i] = 0; }
        }
      }
    }
  }

  swapObstacleCounters(a: number, b: number) {
    this.syncObstacleLists();
    if (a < 0 || b < 0 || a >= this.obstacleCounters.length || b >= this.obstacleCounters.length) return;
    [this.obstacleCounters[a], this.obstacleCounters[b]] = [this.obstacleCounters[b], this.obstacleCounters[a]];
    [this.obstacleOwners[a], this.obstacleOwners[b]] = [this.obstacleOwners[b], this.obstacleOwners[a]];
    [this.obstacleGrace[a], this.obstacleGrace[b]] = [this.obstacleGrace[b], this.obstacleGrace[a]];
  }

  serializeObstacles(): string {
    this.syncObstacleLists();
    return this.obstacleCounters
      .map((t, i) => t > 0 ? `${i}:${t}:${this.obstacleOwners[i]}` : null)
      .filter(Boolean).join(',');
  }

  serializeHand(): CardData[] {
    this.syncObstacleLists();
    return this.hand.map((c, i) => ({ ...c, obstacleturnsLeft: Math.max(0, this.obstacleCounters[i] ?? 0) }));
  }

  // Card operations
  removeForSlot(index: number): CardData | null {
    if (index < 0 || index >= this.hand.length) return null;
    this.syncObstacleLists();
    this.obstacleCounters.splice(index, 1);
    this.obstacleOwners.splice(index, 1);
    this.obstacleGrace.splice(index, 1);
    return this.hand.splice(index, 1)[0];
  }

  playSpecialCard(index: number): CardData | null {
    if (index < 0 || index >= this.hand.length) return null;
    const card = this.hand[index];
    if (!isSpecial(card) || this.isObstructed(index)) return null;
    this.syncObstacleLists();
    this.obstacleCounters.splice(index, 1);
    this.obstacleOwners.splice(index, 1);
    this.obstacleGrace.splice(index, 1);
    const removed = this.hand.splice(index, 1)[0];
    this.deck.discard(removed);
    return removed;
  }

  commitStagedCards(card1: CardData | null, card2: CardData | null) {
    if (card1) this.deck.discard(card1);
    if (card2) this.deck.discard(card2);
  }

  passTurn(): { message: string; drewCard: CardData | null } {
    if (this.hand.length >= MAX_HAND) return { message: `${this.name} passed (hand full).`, drewCard: null };
    const drawn = this.deck.draw();
    if (drawn) {
      this.hand.push(drawn);
      this.syncObstacleLists();
      return { message: `${this.name} passed and drew ${drawn.name}.`, drewCard: drawn };
    }
    return { message: `${this.name} passed (deck empty).`, drewCard: null };
  }

  applyValueShift(targetIndex: number, delta: number): string {
    if (targetIndex < 0 || targetIndex >= this.hand.length) return 'Invalid target.';
    const card = this.hand[targetIndex];
    if (isSpecial(card)) return 'Cannot shift a special card.';
    if (this.isObstructed(targetIndex)) return 'That card is obstructed.';
    const old = card.value;
    if (delta < 0 && old <= 1) return 'Already at minimum.';
    if (delta > 0 && old >= 10) return 'Already at maximum.';
    card.value = old + delta;
    card.name = String(card.value);
    return `${this.name}'s card at position ${targetIndex + 1} changed from ${old} to ${card.value}.`;
  }

  applyMoveCard(targetIndex: number, delta: number): string {
    if (targetIndex < 0 || targetIndex >= this.hand.length) return 'Invalid target.';
    if (this.isObstructed(targetIndex)) return 'That card is obstructed and cannot be moved.';
    const newIndex = targetIndex + delta;
    if (newIndex < 0 || newIndex >= this.hand.length) return `Card is already at the ${delta === -1 ? 'leftmost' : 'rightmost'} position.`;
    if (this.isObstructed(newIndex)) return 'Destination is occupied by an obstructed card.';
    const card = this.hand.splice(targetIndex, 1)[0];
    this.hand.splice(newIndex, 0, card);
    this.swapObstacleCounters(targetIndex, newIndex);
    return `${this.name}'s card ${card.name} moved ${delta === -1 ? 'left' : 'right'} to position ${newIndex + 1}.`;
  }

  applyEmergencyRedraw(indices: number[]): string {
    const sorted = [...indices].sort((a, b) => b - a).slice(0, MAX_REDRAW_CARDS);
    this.syncObstacleLists();
    const parts: string[] = [];
    for (const idx of sorted) {
      if (idx < 0 || idx >= this.hand.length) continue;
      const old = this.hand.splice(idx, 1)[0];
      this.obstacleCounters.splice(idx, 1);
      this.obstacleOwners.splice(idx, 1);
      this.obstacleGrace.splice(idx, 1);
      this.deck.discard(old);
      const drawn = this.deck.draw();
      if (drawn) {
        this.hand.splice(idx, 0, drawn);
        this.syncObstacleLists();
        this.obstacleCounters.splice(idx, 0, 0);
        this.obstacleOwners.splice(idx, 0, -1);
        this.obstacleGrace.splice(idx, 0, 0);
        parts.push(`[${old.name}→${drawn.name}]`);
      }
    }
    return `${this.name} exchanged: ${parts.join(' ')}`;
  }

  hasWon(): boolean {
    if (this.hand.length !== 2) return false;
    const [a, b] = this.hand;
    return !isSpecial(a) && !isSpecial(b) && a.value === 6 && b.value === 7;
  }

  isHandDeadlocked(): boolean {
    if (this.hand.length < MAX_HAND) return false;
    for (const c of this.hand) if (isSpecial(c)) return false;
    for (let i = 0; i < this.hand.length; i++) {
      const c = this.hand[i];
      if (isSpecial(c) || this.isObstructed(i)) continue;
      const v = c.value;
      if (v === 6 || v === 7) return false;
      for (const ni of [i - 1, i + 1]) {
        if (ni < 0 || ni >= this.hand.length) continue;
        const nb = this.hand[ni];
        if (!isSpecial(nb) && !this.isObstructed(ni) && combinedResult(v, nb.value) !== -1) return false;
      }
    }
    return true;
  }

  startTurn(): string {
    return `${this.name}'s turn. Hand: ${this.hand.length} cards.`;
  }
}
