// src/hooks/useCpuGame.ts
// Self-contained game-state manager for CPU (solo) mode.
// Exposes the same { state: GameState, send } interface that App.tsx
// already uses for the multiplayer socket, so GameBoard needs no changes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, CardData, emptyGameState } from '../types/game';
import {
  Difficulty, CpuMove,
  isSpecialCard, canCombine, hasValidMoves,
  decideCpuMove, cpuObstacleTurns,
} from '../utils/cpuPlayer';

// ─────────────────────────────────────────────
// Internal state shape (not exposed to UI)
// ─────────────────────────────────────────────

interface LocalState {
  humanHand: CardData[];
  cpuHand:   CardData[];
  deck:      CardData[];
  isHumanTurn:    boolean;
  phase:          'playing' | 'over';
  winner:         'human' | 'cpu' | 'draw' | null;
  deadlockPending: boolean;
  log:            string[];
  /** Cards the CPU discarded on its most recent turn. Cleared when human acts. */
  cpuLastDiscard: CardData[];
}

// ─────────────────────────────────────────────
// Deck / deal
// ─────────────────────────────────────────────

const MAX_HAND = 9;
let _idCounter = 10_000;
const uid = () => ++_idCounter;

function buildDeck(): CardData[] {
  const deck: CardData[] = [];

  // 18 standard cards: 2× each of 1-5 and 8-10, 1× of 6 and 7
  const doubles = [1, 2, 3, 4, 5, 8, 9, 10];
  for (const v of doubles) {
    deck.push({ id: uid(), type: 'STANDARD', value: v, name: String(v), obstacleturnsLeft: 0 });
    deck.push({ id: uid(), type: 'STANDARD', value: v, name: String(v), obstacleturnsLeft: 0 });
  }
  deck.push({ id: uid(), type: 'STANDARD', value: 6, name: '6', obstacleturnsLeft: 0 });
  deck.push({ id: uid(), type: 'STANDARD', value: 7, name: '7', obstacleturnsLeft: 0 });

  // 9 special cards: 3× each type
  for (let i = 0; i < 3; i++) {
    deck.push({ id: uid(), type: 'VALUE_SHIFT', value: 0, name: 'SHIFT', obstacleturnsLeft: 0 });
    deck.push({ id: uid(), type: 'MOVE_CARD',   value: 0, name: 'MOVE',  obstacleturnsLeft: 0 });
    deck.push({ id: uid(), type: 'OBSTACLE',    value: 0, name: 'LOCK',  obstacleturnsLeft: 0 });
  }

  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initLocalState(): LocalState {
  const deck = buildDeck();
  const humanHand = deck.splice(0, 7);
  const cpuHand   = deck.splice(0, 7);
  return {
    humanHand,
    cpuHand,
    deck,
    isHumanTurn: Math.random() < 0.5,
    phase:  'playing',
    winner: null,
    deadlockPending: false,
    log: ['Game started'],
    cpuLastDiscard: [],
  };
}

// ─────────────────────────────────────────────
// Game-rule helpers
// ─────────────────────────────────────────────

function checkWin(hand: CardData[]): boolean {
  return (
    hand.length === 2 &&
    !isSpecialCard(hand[0]) && hand[0].value === 6 &&
    !isSpecialCard(hand[1]) && hand[1].value === 7
  );
}

function decrementObstacles(hand: CardData[]): CardData[] {
  return hand.map(c =>
    c.obstacleturnsLeft > 0 ? { ...c, obstacleturnsLeft: c.obstacleturnsLeft - 1 } : c
  );
}

function addLog(log: string[], entry: string): string[] {
  return [entry, ...log].slice(0, 20);
}

function applyValueShiftSelf(
  hand: CardData[], specialIdx: number, targetIdx: number, delta: number
): CardData[] {
  const h = hand.filter((_, i) => i !== specialIdx);
  const adj = targetIdx > specialIdx ? targetIdx - 1 : targetIdx;
  return h.map((c, i) =>
    i === adj
      ? { ...c, value: Math.max(1, Math.min(10, c.value + delta)), name: String(Math.max(1, Math.min(10, c.value + delta))) }
      : c
  );
}

function applyValueShiftOn(hand: CardData[], targetIdx: number, delta: number): CardData[] {
  return hand.map((c, i) => {
    if (i !== targetIdx) return c;
    const nv = Math.max(1, Math.min(10, c.value + delta));
    return { ...c, value: nv, name: String(nv) };
  });
}

function moveCardInArray(arr: CardData[], idx: number, delta: number): CardData[] {
  const a = [...arr];
  const card = a[idx];
  a.splice(idx, 1);
  const dest = Math.max(0, Math.min(idx + delta, a.length));
  a.splice(dest, 0, card);
  return a;
}

function applyMoveSelf(
  hand: CardData[], specialIdx: number, targetIdx: number, delta: number
): CardData[] {
  const h = hand.filter((_, i) => i !== specialIdx);
  const adj = targetIdx > specialIdx ? targetIdx - 1 : targetIdx;
  return moveCardInArray(h, adj, delta);
}

function applyObstacleSelf(
  hand: CardData[], specialIdx: number, targetIdx: number, turns: number
): CardData[] {
  const h = hand.filter((_, i) => i !== specialIdx);
  const adj = targetIdx > specialIdx ? targetIdx - 1 : targetIdx;
  return h.map((c, i) => i === adj ? { ...c, obstacleturnsLeft: turns } : c);
}

function applyObstacleOn(hand: CardData[], targetIdx: number, turns: number): CardData[] {
  return hand.map((c, i) => i === targetIdx ? { ...c, obstacleturnsLeft: turns } : c);
}

function drawCard(hand: CardData[], deck: CardData[]): { hand: CardData[]; deck: CardData[] } {
  if (hand.length >= MAX_HAND || deck.length === 0) return { hand, deck };
  return { hand: [...hand, deck[0]], deck: deck.slice(1) };
}

// ─────────────────────────────────────────────
// Human action processor
// ─────────────────────────────────────────────

function processHumanAction(prev: LocalState, event: string, data: unknown): LocalState {
  if (prev.phase === 'over') return prev;

  if (event === 'requestOpponentHand') return prev;

  if (!prev.isHumanTurn) return prev;

  switch (event) {

    case 'playPair': {
      const { first, second } = data as { first: number; second: number };
      const lo = Math.min(first, second), hi = Math.max(first, second);
      const newHand = prev.humanHand.filter((_, i) => i !== lo && i !== hi);
      const logMsg = `You played ${prev.humanHand[lo].name} + ${prev.humanHand[hi].name}`;

      if (checkWin(newHand)) {
        return { ...prev, humanHand: newHand, phase: 'over', winner: 'human', cpuLastDiscard: [], log: addLog(prev.log, logMsg + ' → YOU WIN!') };
      }
      return {
        ...prev,
        humanHand: decrementObstacles(newHand),
        cpuLastDiscard: [],
        isHumanTurn: false,
        log: addLog(prev.log, logMsg),
      };
    }

    case 'playCard': {
      const idx = data as number;
      const newHand = prev.humanHand.filter((_, i) => i !== idx);
      const logMsg = `You played ${prev.humanHand[idx].name} solo`;

      if (checkWin(newHand)) {
        return { ...prev, humanHand: newHand, phase: 'over', winner: 'human', cpuLastDiscard: [], log: addLog(prev.log, logMsg + ' → YOU WIN!') };
      }
      return {
        ...prev,
        humanHand: decrementObstacles(newHand),
        cpuLastDiscard: [],
        isHumanTurn: false,
        log: addLog(prev.log, logMsg),
      };
    }

    case 'specialAction': {
      const { cardIdx, targetOwner, targetIdx, delta } =
        data as { cardIdx: number; targetOwner: 'self' | 'opponent'; targetIdx: number; delta: number };
      const special = prev.humanHand[cardIdx];

      let newHumanHand = [...prev.humanHand];
      let newCpuHand   = [...prev.cpuHand];

      if (special.type === 'VALUE_SHIFT') {
        if (targetOwner === 'self') {
          newHumanHand = applyValueShiftSelf(newHumanHand, cardIdx, targetIdx, delta);
        } else {
          newHumanHand = newHumanHand.filter((_, i) => i !== cardIdx);
          newCpuHand   = applyValueShiftOn(newCpuHand, targetIdx, delta);
        }
      } else if (special.type === 'MOVE_CARD') {
        if (targetOwner === 'self') {
          newHumanHand = applyMoveSelf(newHumanHand, cardIdx, targetIdx, delta);
        } else {
          newHumanHand = newHumanHand.filter((_, i) => i !== cardIdx);
          newCpuHand   = moveCardInArray(newCpuHand, targetIdx, delta);
        }
      } else if (special.type === 'OBSTACLE') {
        if (targetOwner === 'self') {
          newHumanHand = applyObstacleSelf(newHumanHand, cardIdx, targetIdx, delta);
        } else {
          newHumanHand = newHumanHand.filter((_, i) => i !== cardIdx);
          newCpuHand   = applyObstacleOn(newCpuHand, targetIdx, delta);
        }
      }

      if (checkWin(newHumanHand)) {
        return { ...prev, humanHand: newHumanHand, cpuHand: newCpuHand, phase: 'over', winner: 'human', cpuLastDiscard: [],
          log: addLog(prev.log, `You used ${special.name} → YOU WIN!`) };
      }
      return {
        ...prev,
        humanHand: decrementObstacles(newHumanHand),
        cpuHand: newCpuHand,
        cpuLastDiscard: [],
        isHumanTurn: false,
        log: addLog(prev.log, `You used ${special.name}`),
      };
    }

    case 'passTurn': {
      const drawn = drawCard(prev.humanHand, prev.deck);
      const newHand = drawn.hand;
      const newDeck = drawn.deck;

      if (newHand.length >= MAX_HAND && !hasValidMoves(newHand)) {
        return { ...prev, humanHand: newHand, deck: newDeck, deadlockPending: true };
      }

      return {
        ...prev,
        humanHand: decrementObstacles(newHand),
        deck: newDeck,
        cpuLastDiscard: [],
        isHumanTurn: false,
        log: addLog(prev.log, 'You passed'),
      };
    }

    case 'emergencyRedraw': {
      const indices = data as number[];
      const sortedDesc = [...indices].sort((a, b) => b - a);

      let newHand = [...prev.humanHand];
      const removed: CardData[] = [];
      for (const i of sortedDesc) removed.push(...newHand.splice(i, 1));

      let newDeck = shuffle([...prev.deck, ...removed]);

      const drawCount = Math.min(3, newDeck.length);
      newHand = [...newHand, ...newDeck.slice(0, drawCount)];
      newDeck = newDeck.slice(drawCount);

      return {
        ...prev,
        humanHand: decrementObstacles(newHand),
        deck: newDeck,
        deadlockPending: false,
        cpuLastDiscard: [],
        isHumanTurn: false,
        log: addLog(prev.log, 'Emergency redraw'),
      };
    }

    default:
      return prev;
  }
}

// ─────────────────────────────────────────────
// CPU action processor
// ─────────────────────────────────────────────

function applyCpuMove(prev: LocalState, move: CpuMove): LocalState {
  if (prev.phase === 'over' || prev.isHumanTurn) return prev;

  switch (move.type) {

    case 'playPair': {
      const lo = Math.min(move.first, move.second), hi = Math.max(move.first, move.second);
      // FIX 2: capture the actual CardData objects before filtering
      const discarded: CardData[] = [prev.cpuHand[lo], prev.cpuHand[hi]];
      const newCpuHand = prev.cpuHand.filter((_, i) => i !== lo && i !== hi);
      const logMsg = `CPU played ${prev.cpuHand[lo].name} + ${prev.cpuHand[hi].name}`;

      if (checkWin(newCpuHand)) {
        return { ...prev, cpuHand: newCpuHand, cpuLastDiscard: discarded, phase: 'over', winner: 'cpu', log: addLog(prev.log, logMsg + ' → CPU WINS!') };
      }
      return {
        ...prev,
        cpuHand: decrementObstacles(newCpuHand),
        cpuLastDiscard: discarded,
        isHumanTurn: true,
        log: addLog(prev.log, logMsg),
      };
    }

    case 'playCard': {
      // FIX 2: capture the card before filtering
      const discarded: CardData[] = [prev.cpuHand[move.idx]];
      const newCpuHand = prev.cpuHand.filter((_, i) => i !== move.idx);
      const logMsg = `CPU played ${prev.cpuHand[move.idx].name} solo`;

      if (checkWin(newCpuHand)) {
        return { ...prev, cpuHand: newCpuHand, cpuLastDiscard: discarded, phase: 'over', winner: 'cpu', log: addLog(prev.log, logMsg + ' → CPU WINS!') };
      }
      return {
        ...prev,
        cpuHand: decrementObstacles(newCpuHand),
        cpuLastDiscard: discarded,
        isHumanTurn: true,
        log: addLog(prev.log, logMsg),
      };
    }

    case 'specialAction': {
      const { cardIdx, targetOwner, targetIdx, delta } = move;
      const special = prev.cpuHand[cardIdx];

      let newHumanHand = [...prev.humanHand];
      let newCpuHand   = [...prev.cpuHand];

      if (special.type === 'VALUE_SHIFT') {
        if (targetOwner === 'opponent') {
          newCpuHand   = newCpuHand.filter((_, i) => i !== cardIdx);
          newHumanHand = applyValueShiftOn(newHumanHand, targetIdx, delta);
        } else {
          newCpuHand = applyValueShiftSelf(newCpuHand, cardIdx, targetIdx, delta);
        }
      } else if (special.type === 'MOVE_CARD') {
        if (targetOwner === 'opponent') {
          newCpuHand   = newCpuHand.filter((_, i) => i !== cardIdx);
          newHumanHand = moveCardInArray(newHumanHand, targetIdx, delta);
        } else {
          newCpuHand = applyMoveSelf(newCpuHand, cardIdx, targetIdx, delta);
        }
      } else if (special.type === 'OBSTACLE') {
        if (targetOwner === 'opponent') {
          newCpuHand   = newCpuHand.filter((_, i) => i !== cardIdx);
          newHumanHand = applyObstacleOn(newHumanHand, targetIdx, delta);
        } else {
          newCpuHand = applyObstacleSelf(newCpuHand, cardIdx, targetIdx, delta);
        }
      }

      // Special card plays don't show in discard pile (card is consumed, not "played")
      return {
        ...prev,
        humanHand: newHumanHand,
        cpuHand: decrementObstacles(newCpuHand),
        cpuLastDiscard: [],
        isHumanTurn: true,
        log: addLog(prev.log, `CPU used ${special.name}`),
      };
    }

    case 'pass': {
      const drawn = drawCard(prev.cpuHand, prev.deck);
      let newCpuHand = drawn.hand;
      let newDeck    = drawn.deck;

      if (newCpuHand.length >= MAX_HAND && !hasValidMoves(newCpuHand)) {
        const candidates = newCpuHand
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => !isSpecialCard(c))
          .slice(0, 3)
          .map(({ i }) => i)
          .sort((a, b) => b - a);

        const removed: CardData[] = [];
        for (const i of candidates) removed.push(...newCpuHand.splice(i, 1));
        newDeck = shuffle([...newDeck, ...removed]);
        const draws = newDeck.slice(0, 3);
        newDeck     = newDeck.slice(3);
        newCpuHand  = [...newCpuHand, ...draws];
      }

      return {
        ...prev,
        cpuHand: decrementObstacles(newCpuHand),
        deck: newDeck,
        cpuLastDiscard: [],
        isHumanTurn: true,
        log: addLog(prev.log, 'CPU passed'),
      };
    }
  }
}

// ─────────────────────────────────────────────
// Derive public GameState from internal state
// ─────────────────────────────────────────────

function buildMirror(cpuHand: CardData[]): CardData[] {
  return cpuHand.map((c, i) => ({
    id: -(i + 1) * 1000,
    type: 'STANDARD' as const,
    value: 0,
    name: '?',
    obstacleturnsLeft: c.obstacleturnsLeft,
  }));
}

function deriveGameState(local: LocalState, name: string, difficulty: Difficulty): GameState {
  const base = emptyGameState();

  const cpuLabel =
    difficulty === 'easy'   ? 'CPU (Easy)'   :
    difficulty === 'medium' ? 'CPU (Medium)' : 'CPU (Hard)';

  let gameOverResult: GameState['gameOverResult'] = null;
  let winnerHand: CardData[] = [];
  let loserHand:  CardData[] = [];

  if (local.winner === 'human') {
    gameOverResult = 'win';
    winnerHand = local.humanHand;
    loserHand  = local.cpuHand;
  } else if (local.winner === 'cpu') {
    gameOverResult = 'lose';
    winnerHand = local.cpuHand;
    loserHand  = local.humanHand;
  } else if (local.winner === 'draw') {
    gameOverResult = 'draw';
    winnerHand = local.humanHand;
    loserHand  = local.cpuHand;
  }

  return {
    ...base,
    phase:           local.phase === 'over' ? 'over' : 'playing',
    myName:          name,
    opponentName:    cpuLabel,
    isMyTurn:        local.isHumanTurn,
    myHand:          local.humanHand,
    opponentHandSize: local.cpuHand.length,
    opponentHandMirror: local.cpuHand,
    deckRemaining:   local.deck.length,
    myObstacles:     '',
    oppObstacles:    '',
    deadlockPending: local.deadlockPending,
    gameOverResult,
    winnerHand,
    loserHand,
    log:             local.log,
    roomCode:        '',
    // FIX 2: surface CPU's last discarded cards so GameBoard can show them
    opponentLastDiscard: local.cpuLastDiscard,
  };
}

// ─────────────────────────────────────────────
// Public hook
// ─────────────────────────────────────────────

export interface UseCpuGameReturn {
  state:        GameState;
  send:         (event: string, data?: unknown) => void;
  startGame:    (name: string, difficulty: Difficulty) => void;
  resetGame:    () => void;
  clearDeadlock: () => void;
}

export function useCpuGame(): UseCpuGameReturn {
  const [local,      setLocal]      = useState<LocalState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const startGame = useCallback((name: string, diff: Difficulty) => {
    setPlayerName(name);
    setDifficulty(diff);
    setLocal(initLocalState());
  }, []);

  const resetGame = useCallback(() => {
    setLocal(null);
    setPlayerName('');
  }, []);

  const clearDeadlock = useCallback(() => {
    setLocal(prev => prev ? { ...prev, deadlockPending: false } : null);
  }, []);

  const send = useCallback((event: string, data?: unknown) => {
    setLocal(prev => {
      if (!prev) return prev;
      return processHumanAction(prev, event, data);
    });
  }, []);

  // ── CPU turn trigger ──────────────────────────────────────

  useEffect(() => {
    if (!local || local.isHumanTurn || local.phase !== 'playing') return;

    const thinkMs = 900 + Math.random() * 700;
    const id = setTimeout(() => {
      setLocal(prev => {
        if (!prev || prev.isHumanTurn || prev.phase !== 'playing') return prev;
        const move = decideCpuMove(
          prev.cpuHand,
          prev.humanHand.length,
          buildMirror(prev.humanHand),
          difficulty,
        );
        return applyCpuMove(prev, move);
      });
    }, thinkMs);

    return () => clearTimeout(id);
  }, [local, difficulty]);

  const state = useMemo(
    () => local ? deriveGameState(local, playerName, difficulty) : emptyGameState(),
    [local, playerName, difficulty],
  );

  return { state, send, startGame, resetGame, clearDeadlock };
}