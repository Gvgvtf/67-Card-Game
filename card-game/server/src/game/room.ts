import { Player, INITIAL_HAND } from './player';
import { combinedResult, isSpecial, Deck } from './cards';
import { CardData } from './types';

export type RoomPhase = 'waiting' | 'playing' | 'over';

export interface RoomPlayer {
  socketId: string;
  name: string;
  player: Player;
  awaitingRedraw: boolean;
}

export interface ResolveResult {
  error?: string;
  log?: string;
  pass?: boolean;
  playedCard?: CardData | null;
  removedCards?: CardData[];
  senderWon?: boolean;
  opponentWon?: boolean;
  senderHand?: CardData[];
  opponentHand?: CardData[];
  senderObstacles?: string;
  opponentObstacles?: string;
}

export class GameRoom {
  roomCode: string;
  phase: RoomPhase = 'waiting';
  players: RoomPlayer[] = [];
  currentTurn = 0;
  private deck: Deck;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
    this.deck = new Deck();
  }

  addPlayer(socketId: string, name: string): number {
    const index = this.players.length;
    this.players.push({
      socketId,
      name,
      player: new Player(name, this.deck),
      awaitingRedraw: false,
    });
    return index;
  }

  isFull() { return this.players.length >= 2; }

  startGame() {
    this.phase = 'playing';
    for (const rp of this.players) rp.player.dealInitialHand();
  }

  getPlayer(index: number) { return this.players[index]; }
  getOpponent(index: number) { return this.players[1 - index]; }

  resolvePass(senderIndex: number): ResolveResult {
    if (senderIndex !== this.currentTurn) return { error: 'Not your turn.' };
    const sender = this.players[senderIndex];
    const opponent = this.players[1 - senderIndex];
    const result = sender.player.passTurn();
    sender.player.tickObstacles(senderIndex);
    opponent.player.tickObstacles(senderIndex);
    return this._buildResult(senderIndex, result.message, true, null, []);
  }

  resolvePlayCard(senderIndex: number, cardIndex: number): ResolveResult {
    if (senderIndex !== this.currentTurn) return { error: 'Not your turn.' };
    const sender = this.players[senderIndex];
    const opponent = this.players[1 - senderIndex];
    if (cardIndex < 0 || cardIndex >= sender.player.hand.length) return { error: 'Invalid index.' };
    const card = sender.player.hand[cardIndex];
    if (isSpecial(card) || sender.player.isObstructed(cardIndex)) return { error: 'Cannot play.' };
    const removed = sender.player.removeForSlot(cardIndex);
    sender.player.commitStagedCards(removed, null);
    const log = `${sender.name} plays ${card.name}.`;
    sender.player.tickObstacles(senderIndex);
    opponent.player.tickObstacles(senderIndex);
    return this._buildResult(senderIndex, log, false, card, removed ? [removed] : []);
  }

  resolvePlayPair(senderIndex: number, first: number, second: number): ResolveResult {
    if (senderIndex !== this.currentTurn) return { error: 'Not your turn.' };
    const sender = this.players[senderIndex];
    const opponent = this.players[1 - senderIndex];
    if (Math.abs(first - second) !== 1) return { error: 'Cards must be adjacent.' };
    if (first < 0 || first >= sender.player.hand.length || second < 0 || second >= sender.player.hand.length) return { error: 'Invalid indices.' };
    const c1 = sender.player.hand[first];
    const c2 = sender.player.hand[second];
    if (combinedResult(c1.value, c2.value) === -1) return { error: 'Cards do not sum to 6 or 7.' };
    if (sender.player.isObstructed(first) || sender.player.isObstructed(second)) return { error: 'One card is obstructed.' };
    const hi = Math.max(first, second);
    const lo = Math.min(first, second);
    const r2 = sender.player.removeForSlot(hi);
    const r1 = sender.player.removeForSlot(lo);
    sender.player.commitStagedCards(r1, r2);
    const log = `${sender.name} plays pair: ${c1.name}+${c2.name}=${combinedResult(c1.value, c2.value)}.`;
    sender.player.tickObstacles(senderIndex);
    opponent.player.tickObstacles(senderIndex);
    const removed: CardData[] = [];
    if (r1) removed.push(r1);
    if (r2) removed.push(r2);
    return this._buildResult(senderIndex, log, false, c1, removed);
  }

  resolveSpecialAction(senderIndex: number, cardIdx: number, targetOwner: string, targetIdx: number, delta: number): ResolveResult {
    if (senderIndex !== this.currentTurn) return { error: 'Not your turn.' };
    const sender = this.players[senderIndex];
    const opponent = this.players[1 - senderIndex];

    if (cardIdx < 0 || cardIdx >= sender.player.hand.length) return { error: 'Invalid card index.' };
    const card = sender.player.hand[cardIdx];
    if (!isSpecial(card)) return { error: 'Not a special card.' };
    if (sender.player.isObstructed(cardIdx)) return { error: 'That card is obstructed.' };

    const target = targetOwner === 'self' ? sender.player : opponent.player;
    let adjustedTargetIdx = targetIdx;
    if (targetOwner === 'self' && targetIdx > cardIdx) adjustedTargetIdx--;

    let log = `${sender.name} plays ${card.name}. `;
    const played = sender.player.playSpecialCard(cardIdx);
    if (!played) return { error: 'Could not play that card.' };

    if (card.type === 'VALUE_SHIFT') {
      log += target.applyValueShift(adjustedTargetIdx, delta);
    } else if (card.type === 'MOVE_CARD') {
      log += target.applyMoveCard(adjustedTargetIdx, delta);
    } else if (card.type === 'OBSTACLE') {
      if (target.isObstructed(adjustedTargetIdx)) {
        log += 'Blocked — that card is already obstructed!';
      } else {
        log += target.applyObstacle(adjustedTargetIdx, delta, senderIndex);
      }
    }

    sender.player.tickObstacles(senderIndex);
    opponent.player.tickObstacles(senderIndex);
    return this._buildResult(senderIndex, log, false, played, [played]);
  }

  private _buildResult(senderIndex: number, log: string, pass: boolean, playedCard: CardData | null, removedCards: CardData[]): ResolveResult {
    const sender = this.players[senderIndex];
    const opponent = this.players[1 - senderIndex];
    return {
      log, pass, playedCard, removedCards,
      senderWon: sender.player.hasWon(),
      opponentWon: opponent.player.hasWon(),
      senderHand: sender.player.serializeHand(),
      opponentHand: opponent.player.serializeHand(),
      senderObstacles: sender.player.serializeObstacles(),
      opponentObstacles: opponent.player.serializeObstacles(),
    };
  }

  advanceTurn(lastIndex: number) {
    this.currentTurn = (lastIndex + 1) % 2;
    this.players[this.currentTurn].player.startTurn();
  }
}
