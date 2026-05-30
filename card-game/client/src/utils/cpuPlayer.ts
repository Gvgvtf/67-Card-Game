// src/utils/cpuPlayer.ts
// Pure CPU AI decision logic — no React dependencies.

import { CardData } from '../types/game';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export type CpuMove =
  | { type: 'playPair';     first: number; second: number }
  | { type: 'playCard';     idx: number }
  | { type: 'specialAction'; cardIdx: number; targetOwner: 'self' | 'opponent'; targetIdx: number; delta: number }
  | { type: 'pass' };

// ─────────────────────────────────────────────
// Primitive helpers (mirror types/game internals)
// ─────────────────────────────────────────────

export function isSpecialCard(card: CardData): boolean {
  return card.type === 'VALUE_SHIFT' || card.type === 'MOVE_CARD' || card.type === 'OBSTACLE';
}

/** Returns 6 or 7 if the two values can combine (via +, −, ×) to reach that target; else −1. */
export function canCombine(a: number, b: number): number {
  const ops = [a + b, a - b, b - a, a * b];
  for (const r of ops) {
    if (r === 6) return 6;
    if (r === 7) return 7;
  }
  return -1;
}

/** True iff the player has at least one legal move available. */
export function hasValidMoves(hand: CardData[]): boolean {
  // Adjacent pairs
  for (let i = 0; i < hand.length - 1; i++) {
    const a = hand[i], b = hand[i + 1];
    if (a.obstacleturnsLeft > 0 || b.obstacleturnsLeft > 0) continue;
    if (isSpecialCard(a) || isSpecialCard(b)) continue;
    if (canCombine(a.value, b.value) !== -1) return true;
  }
  // Solo 6 / 7
  for (const c of hand) {
    if (!isSpecialCard(c) && (c.value === 6 || c.value === 7) && c.obstacleturnsLeft === 0) return true;
  }
  // Any un-obstructed special
  for (const c of hand) {
    if (isSpecialCard(c) && c.obstacleturnsLeft === 0) return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// Move finders
// ─────────────────────────────────────────────

function findValidPairs(hand: CardData[]): Array<{ first: number; second: number; result: number }> {
  const out: Array<{ first: number; second: number; result: number }> = [];
  for (let i = 0; i < hand.length - 1; i++) {
    const a = hand[i], b = hand[i + 1];
    if (a.obstacleturnsLeft > 0 || b.obstacleturnsLeft > 0) continue;
    if (isSpecialCard(a) || isSpecialCard(b)) continue;
    const r = canCombine(a.value, b.value);
    if (r !== -1) out.push({ first: i, second: i + 1, result: r });
  }
  return out;
}

function findSoloPlays(hand: CardData[]): number[] {
  return hand
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !isSpecialCard(c) && (c.value === 6 || c.value === 7) && c.obstacleturnsLeft === 0)
    .map(({ i }) => i);
}

function findSpecials(hand: CardData[]): Array<{ idx: number; type: string }> {
  return hand
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isSpecialCard(c) && c.obstacleturnsLeft === 0)
    .map(({ c, i }) => ({ idx: i, type: c.type }));
}

// ─────────────────────────────────────────────
// Hand evaluator — lower = better
// ─────────────────────────────────────────────

function evaluateHand(hand: CardData[]): number {
  if (hand.length === 2 && !isSpecialCard(hand[0]) && hand[0].value === 6
                        && !isSpecialCard(hand[1]) && hand[1].value === 7) return -9999;

  let score = hand.length * 10;
  const has6 = hand.some(c => !isSpecialCard(c) && c.value === 6);
  const has7 = hand.some(c => !isSpecialCard(c) && c.value === 7);
  if (has6) score -= 15;
  if (has7) score -= 15;
  if (hand.length > 0 && !isSpecialCard(hand[0]) && hand[0].value === 6)             score -= 10;
  if (hand.length > 0 && !isSpecialCard(hand[hand.length - 1]) && hand[hand.length - 1].value === 7) score -= 10;
  return score;
}

function simPlayPair(hand: CardData[], lo: number, hi: number): CardData[] {
  return hand.filter((_, i) => i !== lo && i !== hi);
}
function simPlayCard(hand: CardData[], idx: number): CardData[] {
  return hand.filter((_, i) => i !== idx);
}

// ─────────────────────────────────────────────
// Obstacle turn generator (replaces timing bar)
// ─────────────────────────────────────────────

export function cpuObstacleTurns(difficulty: Difficulty): number {
  const r = Math.random();
  if (difficulty === 'easy')   return Math.floor(r * 3) + 1;           // 1, 2, 3 equally
  if (difficulty === 'medium') return r < 0.35 ? 1 : r < 0.70 ? 2 : 3; // bias toward 2
  return r < 0.10 ? 1 : r < 0.40 ? 2 : 3;                             // hard: bias toward 3
}

// ─────────────────────────────────────────────
// Special-move builders
// ─────────────────────────────────────────────

/** Build a self-improving special move (VALUE_SHIFT or MOVE_CARD aimed at own hand). */
function buildSelfImprove(
  sp: { idx: number; type: string },
  hand: CardData[],
  difficulty: Difficulty,
): CpuMove | null {
  if (sp.type === 'OBSTACLE') return null; // self-obstacle is never useful for the CPU

  const nonSpecial = hand
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => !isSpecialCard(c) && c.obstacleturnsLeft === 0 && i !== sp.idx);

  if (sp.type === 'VALUE_SHIFT') {
    // Find a card whose ±1 would unlock a valid pair with a neighbour
    for (const { c, i } of nonSpecial) {
      for (const delta of [1, -1]) {
        const nv = c.value + delta;
        if (nv < 1 || nv > 10) continue;
        const neighbours = [i - 1, i + 1].filter(n => n >= 0 && n < hand.length && n !== sp.idx);
        for (const n of neighbours) {
          if (hand[n].obstacleturnsLeft > 0 || isSpecialCard(hand[n])) continue;
          if (canCombine(nv, hand[n].value) !== -1) {
            return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta };
          }
        }
      }
    }
    // Fallback: shift a card toward 6 or 7 if hand is small
    if (difficulty !== 'easy' && hand.length <= 4) {
      for (const { c, i } of nonSpecial) {
        if (c.value < 6 && c.value < 10) return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta: 1 };
        if (c.value > 7 && c.value > 1)  return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta: -1 };
      }
    }
  }

  if (sp.type === 'MOVE_CARD') {
    // Move a 6 toward position 0, or a 7 toward the last position
    for (const { c, i } of nonSpecial) {
      if (c.value === 6 && i > 0) {
        const delta = -1;
        const dest = i + delta === sp.idx ? i + 2 * delta : i + delta;
        if (dest >= 0) return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta };
      }
      if (c.value === 7 && i < hand.length - 1) {
        const delta = 1;
        const dest = i + delta === sp.idx ? i + 2 * delta : i + delta;
        if (dest < hand.length) return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta };
      }
    }
    // Fallback: move any card to create a new adjacent pair
    for (const { c, i } of nonSpecial) {
      for (const delta of [-1, 1]) {
        let dest = i + delta;
        if (dest === sp.idx) dest += delta;
        if (dest < 0 || dest >= hand.length) continue;
        const neighbour = hand[dest];
        if (!isSpecialCard(neighbour) && neighbour.obstacleturnsLeft === 0) {
          if (canCombine(c.value, neighbour.value) !== -1) {
            return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: i, delta };
          }
        }
      }
    }
  }

  return null;
}

/** Build a disruption move aimed at the opponent. */
function buildDisrupt(
  sp: { idx: number; type: string },
  humanHandSize: number,
  humanMirror: CardData[],
  difficulty: Difficulty,
): CpuMove | null {
  const turns = cpuObstacleTurns(difficulty);

  // Find a non-obstructed opponent card slot
  const freeSlot = Array.from({ length: humanHandSize }, (_, i) => i)
    .find(i => (humanMirror[i]?.obstacleturnsLeft ?? 0) === 0);

  if (freeSlot === undefined) return null;

  if (sp.type === 'OBSTACLE') {
    return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'opponent', targetIdx: freeSlot, delta: turns };
  }
  if (sp.type === 'VALUE_SHIFT') {
    // Shift first free card (we can't see values so any disruption helps)
    return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'opponent', targetIdx: freeSlot, delta: -1 };
  }
  if (sp.type === 'MOVE_CARD') {
    // Move their first free card — disrupts positioning
    if (humanHandSize > 1) {
      // Prefer slot 0 (might be their 6) or last slot (might be their 7)
      const target = (humanMirror[0]?.obstacleturnsLeft ?? 0) === 0 ? 0
        : (humanMirror[humanHandSize - 1]?.obstacleturnsLeft ?? 0) === 0 ? humanHandSize - 1
        : freeSlot;
      // Move it inward (away from edge, disrupts win positioning)
      const delta = target === 0 ? 1 : -1;
      return { type: 'specialAction', cardIdx: sp.idx, targetOwner: 'opponent', targetIdx: target, delta };
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// Difficulty-specific decision trees
// ─────────────────────────────────────────────

function decideEasy(
  hand: CardData[],
  pairs: ReturnType<typeof findValidPairs>,
  solos: number[],
  specials: ReturnType<typeof findSpecials>,
): CpuMove {
  const moves: CpuMove[] = [
    ...pairs.map(p => ({ type: 'playPair' as const, first: p.first, second: p.second })),
    ...solos.map(i => ({ type: 'playCard' as const, idx: i })),
  ];

  // Occasionally use a special (25 % chance) on self — random target
  if (specials.length > 0 && Math.random() < 0.25) {
    const sp = specials[Math.floor(Math.random() * specials.length)];
    const nonSpecial = hand
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => !isSpecialCard(c) && c.obstacleturnsLeft === 0 && i !== sp.idx);
    if (nonSpecial.length > 0) {
      const t = nonSpecial[Math.floor(Math.random() * nonSpecial.length)];
      if (sp.type === 'VALUE_SHIFT' && t.c.value < 10) {
        moves.push({ type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: t.i, delta: 1 });
      } else if (sp.type === 'MOVE_CARD') {
        const delta = Math.random() < 0.5 ? -1 : 1;
        let dest = t.i + delta;
        if (dest === sp.idx) dest += delta;
        if (dest >= 0 && dest < hand.length) {
          moves.push({ type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: t.i, delta });
        }
      } else if (sp.type === 'OBSTACLE') {
        moves.push({ type: 'specialAction', cardIdx: sp.idx, targetOwner: 'self', targetIdx: t.i, delta: 1 });
      }
    }
  }

  if (moves.length === 0) return { type: 'pass' };
  return moves[Math.floor(Math.random() * moves.length)];
}

function decideMedium(
  hand: CardData[],
  pairs: ReturnType<typeof findValidPairs>,
  solos: number[],
  specials: ReturnType<typeof findSpecials>,
  humanHandSize: number,
  humanMirror: CardData[],
): CpuMove {
  // 1. Winning move first
  for (const s of solos) {
    if (evaluateHand(simPlayCard(hand, s)) <= -9999) return { type: 'playCard', idx: s };
  }
  for (const p of pairs) {
    if (evaluateHand(simPlayPair(hand, p.first, p.second)) <= -9999) return { type: 'playPair', first: p.first, second: p.second };
  }

  // 2. Disrupt opponent if they're close to winning
  if (specials.length > 0 && humanHandSize <= 3) {
    for (const sp of specials) {
      const m = buildDisrupt(sp, humanHandSize, humanMirror, 'medium');
      if (m) return m;
    }
  }

  // 3. Best pair/solo by heuristic
  let bestScore = Infinity, bestMove: CpuMove = { type: 'pass' };
  for (const p of pairs) {
    const s = evaluateHand(simPlayPair(hand, p.first, p.second));
    if (s < bestScore) { bestScore = s; bestMove = { type: 'playPair', first: p.first, second: p.second }; }
  }
  for (const s of solos) {
    const sc = evaluateHand(simPlayCard(hand, s));
    if (sc < bestScore) { bestScore = sc; bestMove = { type: 'playCard', idx: s }; }
  }
  if (bestMove.type !== 'pass') return bestMove;

  // 4. Self-improving special
  if (specials.length > 0) {
    const sp = specials[Math.floor(Math.random() * specials.length)];
    const m = buildSelfImprove(sp, hand, 'medium');
    if (m) return m;
  }

  return { type: 'pass' };
}

function decideHard(
  hand: CardData[],
  pairs: ReturnType<typeof findValidPairs>,
  solos: number[],
  specials: ReturnType<typeof findSpecials>,
  humanHandSize: number,
  humanMirror: CardData[],
): CpuMove {
  // 1. Win immediately
  for (const s of solos) {
    if (evaluateHand(simPlayCard(hand, s)) <= -9999) return { type: 'playCard', idx: s };
  }
  for (const p of pairs) {
    if (evaluateHand(simPlayPair(hand, p.first, p.second)) <= -9999) return { type: 'playPair', first: p.first, second: p.second };
  }

  // 2. Aggressive disruption when opponent is dangerous
  if (specials.length > 0 && humanHandSize <= 4) {
    for (const sp of specials) {
      const m = buildDisrupt(sp, humanHandSize, humanMirror, 'hard');
      if (m) return m;
    }
  }

  // 3. Best pair/solo
  let bestScore = Infinity, bestMove: CpuMove = { type: 'pass' };
  for (const p of pairs) {
    const s = evaluateHand(simPlayPair(hand, p.first, p.second));
    if (s < bestScore) { bestScore = s; bestMove = { type: 'playPair', first: p.first, second: p.second }; }
  }
  for (const s of solos) {
    const sc = evaluateHand(simPlayCard(hand, s));
    if (sc < bestScore) { bestScore = sc; bestMove = { type: 'playCard', idx: s }; }
  }
  if (bestMove.type !== 'pass') return bestMove;

  // 4. Strategic self-improvement
  for (const sp of specials) {
    const m = buildSelfImprove(sp, hand, 'hard');
    if (m) return m;
  }

  // 5. Moderate disruption even when opponent isn't imminently winning
  if (specials.length > 0 && humanHandSize > 0) {
    const sp = specials[0];
    const m = buildDisrupt(sp, humanHandSize, humanMirror, 'hard');
    if (m) return m;
  }

  return { type: 'pass' };
}

// ─────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────

export function decideCpuMove(
  cpuHand: CardData[],
  humanHandSize: number,
  humanMirror: CardData[],
  difficulty: Difficulty,
): CpuMove {
  const pairs   = findValidPairs(cpuHand);
  const solos   = findSoloPlays(cpuHand);
  const specials = findSpecials(cpuHand);

  switch (difficulty) {
    case 'easy':   return decideEasy(cpuHand, pairs, solos, specials);
    case 'medium': return decideMedium(cpuHand, pairs, solos, specials, humanHandSize, humanMirror);
    case 'hard':   return decideHard(cpuHand, pairs, solos, specials, humanHandSize, humanMirror);
  }
}
