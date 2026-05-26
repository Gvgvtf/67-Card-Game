export type CardType = 'STANDARD' | 'VALUE_SHIFT' | 'MOVE_CARD' | 'OBSTACLE';

export interface CardData {
  id: number;
  type: CardType;
  value: number;
  name: string;
  obstacleturnsLeft: number;
}

export type GamePhase = 'home' | 'lobby' | 'playing' | 'over';

export interface GameState {
  phase: GamePhase;
  myName: string;
  opponentName: string;
  myHand: CardData[];
  opponentHandSize: number;
  opponentHandMirror: CardData[];
  isMyTurn: boolean;
  deckRemaining: number;
  myObstacles: string;
  oppObstacles: string;
  roomCode: string;
  playerIndex: number;
  gameOverResult: 'win' | 'lose' | 'draw' | null;
  winnerHand: CardData[];
  loserHand: CardData[];
  loserName: string;
  log: string[];
  deadlockPending: boolean;
}

export function emptyGameState(): GameState {
  return {
    phase: 'home',
    myName: '',
    opponentName: '',
    myHand: [],
    opponentHandSize: 0,
    opponentHandMirror: [],
    isMyTurn: false,
    deckRemaining: 0,
    myObstacles: '',
    oppObstacles: '',
    roomCode: '',
    playerIndex: -1,
    gameOverResult: null,
    winnerHand: [],
    loserHand: [],
    loserName: '',
    log: [],
    deadlockPending: false,
  };
}

export function parseObstacles(data: string): Map<number, number> {
  const map = new Map<number, number>();
  if (!data) return map;
  for (const entry of data.split(',')) {
    const parts = entry.split(':');
    if (parts.length >= 2) map.set(parseInt(parts[0]), parseInt(parts[1]));
  }
  return map;
}

export function isSpecial(card: CardData): boolean {
  return card.type !== 'STANDARD';
}

export function combinedResult(v1: number, v2: number): number {
  for (const r of [v1 + v2, v1 - v2, v2 - v1, v1 * v2]) if (r === 6 || r === 7) return r;
  return -1;
}

export function cardDescription(card: CardData): string {
  if (card.value === 6 || card.value === 7) return 'One of the two win cards. Secure position [6, 7] to win!';
  if (card.type === 'VALUE_SHIFT') return 'Add or subtract 1 from any card in either hand.';
  if (card.type === 'MOVE_CARD') return 'Move any card one position left or right.';
  if (card.type === 'OBSTACLE') return 'Lock any card for 1–3 turns using the timing bar.';
  return 'Combine with an adjacent card to sum to 6 or 7.';
}
