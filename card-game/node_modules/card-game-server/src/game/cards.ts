import { CardData, CardType } from './types';

let nextId = 1;

export function resetCardIds() { nextId = 1; }

export function makeStandardCard(value: number): CardData {
  return { id: nextId++, type: 'STANDARD', value, name: String(value), obstacleturnsLeft: 0 };
}

export function makeSpecialCard(type: 'VALUE_SHIFT' | 'MOVE_CARD' | 'OBSTACLE'): CardData {
  const names: Record<string, string> = { VALUE_SHIFT: '+1/-1', MOVE_CARD: 'Move', OBSTACLE: 'Obstacle' };
  return { id: nextId++, type, value: 0, name: names[type], obstacleturnsLeft: 0 };
}

export function isSpecial(card: CardData): boolean {
  return card.type !== 'STANDARD';
}

export function cardDescription(card: CardData): string {
  if (card.value === 6 || card.value === 7) return 'One of the two cards needed to win.';
  if (card.type === 'VALUE_SHIFT') return 'Add or subtract 1 from any card in either hand.';
  if (card.type === 'MOVE_CARD') return 'Move any card one position left or right.';
  if (card.type === 'OBSTACLE') return 'Lock any card for 1–3 turns. Time the bar for longer locks!';
  return 'Combine with adjacent card to sum to 6 or 7.';
}

export function combinedResult(v1: number, v2: number): number {
  const results = [v1 + v2, v1 - v2, v2 - v1, v1 * v2];
  for (const r of results) if (r === 6 || r === 7) return r;
  return -1;
}

export class Deck {
  private drawPile: CardData[] = [];
  private discardPile: CardData[] = [];

  constructor() {
    this.build();
    this.shuffle();
  }

  private build() {
    for (let v = 1; v <= 10; v++) {
      this.drawPile.push(makeStandardCard(v));
      if (v !== 6 && v !== 7) this.drawPile.push(makeStandardCard(v));
    }
    for (let i = 0; i < 3; i++) {
      this.drawPile.push(makeSpecialCard('VALUE_SHIFT'));
      this.drawPile.push(makeSpecialCard('MOVE_CARD'));
      this.drawPile.push(makeSpecialCard('OBSTACLE'));
    }
  }

  private shuffle() {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }

  draw(): CardData | null {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length === 0) return null;
      this.drawPile = [...this.discardPile];
      this.discardPile = [];
      this.shuffle();
    }
    return this.drawPile.shift() ?? null;
  }

  drawMultiple(count: number): CardData[] {
    const result: CardData[] = [];
    for (let i = 0; i < count; i++) {
      const c = this.draw();
      if (c) result.push(c);
    }
    return result;
  }

  discard(card: CardData) { this.discardPile.push(card); }
  remaining() { return this.drawPile.length; }
}
