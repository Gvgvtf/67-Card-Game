import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CardView } from './CardView';
import { TimingBar } from './TimingBar';
import { GameState, CardData, isSpecial, combinedResult, parseObstacles } from '../types/game';

interface Props {
  state: GameState;
  send: (event: string, data?: unknown) => void;
  onClearDeadlock: () => void;
  onPlayAgain?: () => void;
}

type UIMode = 'idle' | 'selected1' | 'selected2' | 'choosingTarget' | 'choosingOp' | 'redraw';

// ─── Discard pile ───────────────────────────────────────────────────────────
interface DiscardEntry { cards: CardData[]; faceDown: boolean; }

const TURN_SECONDS = 30;

export const GameBoard: React.FC<Props> = ({ state, send, onClearDeadlock, onPlayAgain }) => {
  const [uiMode, setUiMode] = useState<UIMode>('idle');
  const [selected1Idx, setSelected1Idx] = useState(-1);
  const [selected1Card, setSelected1Card] = useState<CardData | null>(null);
  const [selected2Idx, setSelected2Idx] = useState(-1);
  const [selected2Card, setSelected2Card] = useState<CardData | null>(null);
  const [activeSpecialIdx, setActiveSpecialIdx] = useState(-1);
  const [activeSpecialCard, setActiveSpecialCard] = useState<CardData | null>(null);
  const [targetOwner, setTargetOwner] = useState<'self' | 'opponent'>('self');
  const [targetIdx, setTargetIdx] = useState(-1);
  const [hoveredMyCard, setHoveredMyCard] = useState(-1);
  const [hoveredOppCard, setHoveredOppCard] = useState(-1);
  const [redrawSelected, setRedrawSelected] = useState<Set<number>>(new Set());
  const [showTimingBar, setShowTimingBar] = useState(false);
  const [timingTarget, setTimingTarget] = useState<{ owner: 'self' | 'opponent'; idx: number; specialIdx: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);

  // ─── NEW: Discard pile state ──────────────────────────────────────────────
  const [discardPile, setDiscardPile] = useState<DiscardEntry[]>([]);
  const prevMyHandRef   = useRef(state.myHand);
  const prevOppSizeRef  = useRef(state.opponentHandSize);
  const discardTotal    = discardPile.reduce((s, e) => s + e.cards.length, 0);

  // ─── NEW: Coin flip shown once on first mount ─────────────────────────────
  const [showCoinFlip, setShowCoinFlip] = useState(state.phase !== 'over');

  // Separate obstacle state for opponent (never reveals card faces)
  const oppObstacles = parseObstacles(state.oppObstacles);
  const myObstacles = parseObstacles(state.myObstacles);

  // Reset selection state when turn changes
  useEffect(() => {
    if (!state.isMyTurn) {
      setUiMode('idle');
      setSelected1Idx(-1);
      setSelected1Card(null);
      setSelected2Idx(-1);
      setSelected2Card(null);
      setActiveSpecialIdx(-1);
      setActiveSpecialCard(null);
      setTargetOwner('self');
      setTargetIdx(-1);
      setHoveredMyCard(-1);
      setHoveredOppCard(-1);
    }
  }, [state.isMyTurn]);

  // Turn timer — use ref to track whether turn is still active before sending
  const isMyTurnRef = useRef(state.isMyTurn);
  useEffect(() => { isMyTurnRef.current = state.isMyTurn; }, [state.isMyTurn]);

  useEffect(() => {
    setTimeLeft(TURN_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          if (isMyTurnRef.current) send('passTurn');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isMyTurn, send]);

  // ESC key to cancel targeting/selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetUI();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── NEW: Track MY discards by watching hand shrink ──────────────────────
  useEffect(() => {
    const prev = prevMyHandRef.current;
    const curr = state.myHand;
    if (prev.length > 0 && curr.length < prev.length && state.phase === 'playing') {
      const currIds = new Set(curr.map(c => c.id));
      const removed = prev.filter(c => !currIds.has(c.id));
      // 1 = solo/special play, 2 = pair; ignore emergency redraw (3 cards)
      if (removed.length >= 1 && removed.length <= 2) {
        setDiscardPile(p => [{ cards: removed, faceDown: false }, ...p.slice(0, 9)]);
      }
    }
    prevMyHandRef.current = curr;
  }, [state.myHand, state.phase]);

  // ─── NEW: Track OPPONENT discards by watching hand size shrink ───────────
  useEffect(() => {
    const prev = prevOppSizeRef.current;
    const curr = state.opponentHandSize;
    if (prev > 0 && curr < prev && state.phase === 'playing') {
      const diff = Math.min(prev - curr, 2);
      const faceDownCards: CardData[] = Array.from({ length: diff }, (_, i) => ({
        id: -(Date.now() + i + 5000),
        type: 'STANDARD' as const,
        value: 0,
        name: '?',
        obstacleturnsLeft: 0,
      }));
      setDiscardPile(p => [{ cards: faceDownCards, faceDown: true }, ...p.slice(0, 9)]);
    }
    prevOppSizeRef.current = curr;
  }, [state.opponentHandSize, state.phase]);

  // ─── NEW: Close coin flip when game ends ─────────────────────────────────
  useEffect(() => {
    if (state.phase === 'over') setShowCoinFlip(false);
  }, [state.phase]);

  const isMyCardObstructed = useCallback((idx: number): boolean => {
    return (myObstacles.get(idx) ?? 0) > 0 || (state.myHand[idx]?.obstacleturnsLeft ?? 0) > 0;
  }, [myObstacles, state.myHand]);

  const isOppCardObstructed = useCallback((idx: number): boolean => {
    const fromMap = (oppObstacles.get(idx) ?? 0) > 0;
    const fromMirror = state.opponentHandMirror[idx]?.obstacleturnsLeft ?? 0;
    return fromMap || fromMirror > 0;
  }, [oppObstacles, state.opponentHandMirror]);

  const resetUI = useCallback(() => {
    setUiMode('idle');
    setSelected1Idx(-1); setSelected1Card(null);
    setSelected2Idx(-1); setSelected2Card(null);
    setActiveSpecialIdx(-1); setActiveSpecialCard(null);
    setTargetOwner('self'); setTargetIdx(-1);
    setHoveredMyCard(-1); setHoveredOppCard(-1);
  }, []);

  const handleMyCardClick = useCallback((idx: number) => {
    if (!state.isMyTurn) return;
    const card = state.myHand[idx];
    if (!card) return;

    if (uiMode === 'choosingTarget') {
      if (idx === activeSpecialIdx) { resetUI(); return; }
      if (isMyCardObstructed(idx)) return;
      if (activeSpecialCard?.type === 'OBSTACLE') {
        setShowTimingBar(true);
        setTimingTarget({ owner: 'self', idx, specialIdx: activeSpecialIdx });
      } else {
        setTargetOwner('self'); setTargetIdx(idx);
        setUiMode('choosingOp');
      }
      return;
    }

    if (uiMode === 'choosingOp') return;

    if (uiMode === 'idle') {
      if (isSpecial(card)) {
        if (isMyCardObstructed(idx)) return;
        send('requestOpponentHand');
        setActiveSpecialIdx(idx);
        setActiveSpecialCard(card);
        setUiMode('choosingTarget');
        return;
      }
      if (isMyCardObstructed(idx)) return;
      setSelected1Idx(idx); setSelected1Card(card); setUiMode('selected1');
      return;
    }

    if (uiMode === 'selected1') {
      if (idx === selected1Idx) { resetUI(); return; }
      if (!isSpecial(card) && !isMyCardObstructed(idx)) {
        if (Math.abs(idx - selected1Idx) === 1) {
          const res = combinedResult(card.value, selected1Card!.value);
          if (res !== -1) {
            setSelected2Idx(idx); setSelected2Card(card); setUiMode('selected2');
            return;
          }
        }
        setSelected1Idx(idx); setSelected1Card(card);
      }
      return;
    }

    if (uiMode === 'selected2') {
      if (idx === selected1Idx || idx === selected2Idx) { resetUI(); return; }
      if (!isSpecial(card) && !isMyCardObstructed(idx)) {
        setSelected1Idx(idx); setSelected1Card(card);
        setSelected2Idx(-1); setSelected2Card(null);
        setUiMode('selected1');
      }
      return;
    }
  }, [state.isMyTurn, state.myHand, uiMode, activeSpecialIdx, activeSpecialCard, selected1Idx, selected1Card, selected2Idx, isMyCardObstructed, send, resetUI]);

  const handleOppCardClick = useCallback((idx: number) => {
    if (!state.isMyTurn || uiMode !== 'choosingTarget') return;
    if (isOppCardObstructed(idx)) return;
    if (activeSpecialCard?.type === 'OBSTACLE') {
      setShowTimingBar(true);
      setTimingTarget({ owner: 'opponent', idx, specialIdx: activeSpecialIdx });
    } else {
      setTargetOwner('opponent'); setTargetIdx(idx);
      setUiMode('choosingOp');
    }
  }, [state.isMyTurn, uiMode, activeSpecialCard, activeSpecialIdx, isOppCardObstructed]);

  const handlePlaySolo = useCallback(() => {
    if (!selected1Card || (selected1Card.value !== 6 && selected1Card.value !== 7)) return;
    send('playCard', selected1Idx);
    resetUI();
  }, [selected1Card, selected1Idx, send, resetUI]);

  const handlePlayPair = useCallback(() => {
    if (selected1Idx === -1 || selected2Idx === -1) return;
    const lo = Math.min(selected1Idx, selected2Idx);
    const hi = Math.max(selected1Idx, selected2Idx);
    send('playPair', { first: lo, second: hi });
    resetUI();
  }, [selected1Idx, selected2Idx, send, resetUI]);

  const handleOpButton = useCallback((delta: number) => {
    if (uiMode !== 'choosingOp') return;
    send('specialAction', { cardIdx: activeSpecialIdx, targetOwner, targetIdx, delta });
    resetUI();
  }, [uiMode, activeSpecialIdx, targetOwner, targetIdx, send, resetUI]);

  const handleTimingFire = useCallback((turns: number) => {
    if (!timingTarget) return;
    setShowTimingBar(false);
    send('specialAction', {
      cardIdx: timingTarget.specialIdx,
      targetOwner: timingTarget.owner,
      targetIdx: timingTarget.idx,
      delta: turns,
    });
    setTimingTarget(null);
    resetUI();
  }, [timingTarget, send, resetUI]);

  const toggleRedraw = useCallback((idx: number) => {
    setRedrawSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else if (next.size < 3) next.add(idx);
      return next;
    });
  }, []);

  const confirmRedraw = useCallback(() => {
    send('emergencyRedraw', Array.from(redrawSelected));
    setRedrawSelected(new Set());
    setUiMode('idle');
    onClearDeadlock();
  }, [redrawSelected, send, onClearDeadlock]);

  const isMoveCard = activeSpecialCard?.type === 'MOVE_CARD';
  const isValueShift = activeSpecialCard?.type === 'VALUE_SHIFT';
  const isTargeting = uiMode === 'choosingTarget' || uiMode === 'choosingOp';
  const timerWarn = timeLeft <= 8;

  const oppFinalHand = state.gameOverResult === 'win' || state.gameOverResult === 'draw' ? state.loserHand : state.winnerHand;
  const myFinalHand = state.gameOverResult === 'win' || state.gameOverResult === 'draw' ? state.winnerHand : state.loserHand;
  const oppDisplayCount = state.phase === 'over' && oppFinalHand.length > 0 ? oppFinalHand.length : state.opponentHandSize;
  const myDisplayHand = state.phase === 'over' && myFinalHand.length > 0 ? myFinalHand : state.myHand;

  let leftBlocked = false;
  let rightBlocked = false;
  if (uiMode === 'choosingOp' && isMoveCard) {
    const handSize = targetOwner === 'self' ? state.myHand.length : state.opponentHandSize;
    let checkLeftIdx = targetIdx - 1;
    if (targetOwner === 'self' && checkLeftIdx === activeSpecialIdx) checkLeftIdx--;
    leftBlocked = checkLeftIdx < 0 || (targetOwner === 'self' ? isMyCardObstructed(checkLeftIdx) : isOppCardObstructed(checkLeftIdx));

    let checkRightIdx = targetIdx + 1;
    if (targetOwner === 'self' && checkRightIdx === activeSpecialIdx) checkRightIdx++;
    rightBlocked = checkRightIdx >= handSize || (targetOwner === 'self' ? isMyCardObstructed(checkRightIdx) : isOppCardObstructed(checkRightIdx));
  }

  const targetCardValue = uiMode === 'choosingOp' && isValueShift && targetOwner === 'self'
    ? (state.myHand[targetIdx]?.value ?? null)
    : null;
  const shiftPlusBlocked  = isValueShift && targetCardValue === 10;
  const shiftMinusBlocked = isValueShift && targetCardValue === 1;

  return (
    <div
      tabIndex={0}
      style={{
        width: '100vw', height: '100vh', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 40%, #0d3320 0%, #061a10 50%, #030d08 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'Georgia, serif', position: 'relative',
        userSelect: 'none', outline: 'none',
      }}
    >
      {/* Felt texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
        pointerEvents: 'none',
      }} />

      {/* Table oval */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%', right: '5%', bottom: '10%',
        borderRadius: '50%', border: '2px solid rgba(139,115,85,0.25)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }} />

      {/* Dim overlay during targeting */}
      {isTargeting && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 5, pointerEvents: 'none',
        }} />
      )}

      {/* Game Over Overlay */}
      {state.phase === 'over' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          background: state.gameOverResult === 'win'
            ? 'radial-gradient(ellipse at 50% 40%, rgba(30,20,0,0.92) 0%, rgba(5,3,0,0.97) 100%)'
            : state.gameOverResult === 'lose'
            ? 'radial-gradient(ellipse at 50% 40%, rgba(25,5,5,0.93) 0%, rgba(4,2,2,0.97) 100%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(10,12,18,0.93) 0%, rgba(3,4,6,0.97) 100%)',
        }}>
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: state.gameOverResult === 'win'
              ? 'radial-gradient(circle, rgba(240,192,64,0.12) 0%, transparent 70%)'
              : state.gameOverResult === 'lose'
              ? 'radial-gradient(circle, rgba(248,113,113,0.10) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(200,184,138,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative',
            border: `1px solid ${state.gameOverResult === 'win' ? 'rgba(240,192,64,0.35)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.3)' : 'rgba(200,184,138,0.3)'}`,
            borderRadius: '16px', padding: '2.5rem 3rem', textAlign: 'center',
            backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.25)',
            boxShadow: state.gameOverResult === 'win'
              ? '0 0 60px rgba(240,192,64,0.15), inset 0 1px 0 rgba(240,192,64,0.2)'
              : state.gameOverResult === 'lose'
              ? '0 0 60px rgba(248,113,113,0.12), inset 0 1px 0 rgba(248,113,113,0.15)'
              : '0 0 60px rgba(200,184,138,0.12), inset 0 1px 0 rgba(200,184,138,0.15)',
            minWidth: 340,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: 1, background: state.gameOverResult === 'win' ? 'rgba(240,192,64,0.3)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.3)' : 'rgba(200,184,138,0.3)' }} />
              <span style={{ fontSize: '14px', color: state.gameOverResult === 'win' ? '#f0c040' : state.gameOverResult === 'lose' ? '#f87171' : '#c8b88a', opacity: 0.7 }}>
                {state.gameOverResult === 'win' ? '★' : state.gameOverResult === 'lose' ? '✦' : '◆'}
              </span>
              <div style={{ flex: 1, height: 1, background: state.gameOverResult === 'win' ? 'rgba(240,192,64,0.3)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.3)' : 'rgba(200,184,138,0.3)' }} />
            </div>
            <h1 style={{
              fontSize: '72px', margin: '0 0 0.1em',
              color: state.gameOverResult === 'win' ? '#f0c040' : state.gameOverResult === 'lose' ? '#f87171' : '#c8b88a',
              textShadow: state.gameOverResult === 'win'
                ? '0 0 30px rgba(240,192,64,0.6), 0 0 60px rgba(240,192,64,0.2), 0 3px 8px rgba(0,0,0,0.9)'
                : state.gameOverResult === 'lose'
                ? '0 0 30px rgba(248,113,113,0.5), 0 3px 8px rgba(0,0,0,0.9)'
                : '0 0 30px rgba(200,184,138,0.4), 0 3px 8px rgba(0,0,0,0.9)',
              fontFamily: 'SuperCartoon, Arial, sans-serif',
              textTransform: 'uppercase', letterSpacing: '4px',
              animation: 'gameOverEntrance 0.6s ease-out both',
            }}>
              {state.gameOverResult === 'draw' ? "DRAW" : state.gameOverResult === 'win' ? "YOU WIN" : "YOU LOSE"}
            </h1>
            <div style={{
              fontSize: '12px', letterSpacing: '3px',
              color: state.gameOverResult === 'win' ? '#8a7040' : state.gameOverResult === 'lose' ? '#7a3030' : '#6a6050',
              marginBottom: '2rem', textTransform: 'uppercase',
              animation: 'gameOverEntrance 0.6s 0.15s ease-out both',
            }}>
              {state.gameOverResult === 'win' ? 'victory' : state.gameOverResult === 'lose' ? `${state.opponentName} wins` : 'No winner this round'}
            </div>
            {(state.gameOverResult === 'win' || state.gameOverResult === 'draw') && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '24px', marginBottom: '2rem', animation: 'gameOverCardsRise 0.7s 0.3s ease-out both' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#8a7040', textTransform: 'uppercase' }}>Left</div>
                  <div style={{ transform: 'scale(1.25)', filter: 'drop-shadow(0 0 18px rgba(240,192,64,0.9)) drop-shadow(0 0 36px rgba(240,192,64,0.4))', transformOrigin: 'bottom center' }}>
                    <CardView card={{ id: -901, type: 'STANDARD', value: 6, name: '6', obstacleturnsLeft: 0 }} glowing />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '20px', color: 'rgba(240,192,64,0.5)', fontSize: '22px' }}>
                  <span>·</span><span>·</span><span>·</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#8a7040', textTransform: 'uppercase' }}>Right</div>
                  <div style={{ transform: 'scale(1.25)', filter: 'drop-shadow(0 0 18px rgba(240,192,64,0.9)) drop-shadow(0 0 36px rgba(240,192,64,0.4))', transformOrigin: 'bottom center' }}>
                    <CardView card={{ id: -902, type: 'STANDARD', value: 7, name: '7', obstacleturnsLeft: 0 }} glowing />
                  </div>
                </div>
              </div>
            )}
            {state.gameOverResult === 'lose' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '2rem', opacity: 0.35, animation: 'gameOverCardsRise 0.7s 0.3s ease-out both' }}>
                <CardView card={{ id: -901, type: 'STANDARD', value: 6, name: '6', obstacleturnsLeft: 0 }} style={{ filter: 'grayscale(1) brightness(0.4)' }} />
                <CardView card={{ id: -902, type: 'STANDARD', value: 7, name: '7', obstacleturnsLeft: 0 }} style={{ filter: 'grayscale(1) brightness(0.4)' }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <div style={{ flex: 1, height: 1, background: state.gameOverResult === 'win' ? 'rgba(240,192,64,0.2)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.2)' : 'rgba(200,184,138,0.2)' }} />
              <span style={{ fontSize: '10px', color: state.gameOverResult === 'win' ? 'rgba(240,192,64,0.5)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.4)' : 'rgba(200,184,138,0.4)', letterSpacing: '2px' }}>
                {state.gameOverResult === 'win' ? 'SIX SEVEEEEN' : state.gameOverResult === 'lose' ? 'Better luck next time' : '[ tied ]'}
              </span>
              <div style={{ flex: 1, height: 1, background: state.gameOverResult === 'win' ? 'rgba(240,192,64,0.2)' : state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.2)' : 'rgba(200,184,138,0.2)' }} />
            </div>
            <button
              onClick={onPlayAgain}
              style={{
                padding: '12px 40px', borderRadius: '7px',
                background: state.gameOverResult === 'win'
                  ? 'linear-gradient(135deg, #c8960c, #f0c040, #c8960c)'
                  : state.gameOverResult === 'lose'
                  ? 'linear-gradient(135deg, #7a1a1a, #c0303030, #7a1a1a)'
                  : 'linear-gradient(135deg, #4a3e20, #8a7040, #4a3e20)',
                color: state.gameOverResult === 'win' ? '#1a1200' : '#f0e8d0',
                border: state.gameOverResult !== 'win' ? `1px solid ${state.gameOverResult === 'lose' ? 'rgba(248,113,113,0.5)' : 'rgba(200,184,138,0.4)'}` : 'none',
                fontSize: '15px', fontFamily: 'Georgia, serif', fontWeight: '700',
                cursor: 'pointer', pointerEvents: 'auto', letterSpacing: '1px',
                boxShadow: state.gameOverResult === 'win' ? '0 4px 20px rgba(240,192,64,0.35), 0 2px 6px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.5)',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* ─── OPPONENT AREA ─── */}
      <div style={{ width: '100%', padding: '12px 24px 0', zIndex: isTargeting ? 10 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', color: '#8a7040', letterSpacing: '1px' }}>
            {state.opponentName}
          </div>
          {!state.isMyTurn && (
            <span style={{ fontSize: '11px', color: '#4ade80', animation: 'blink 1.4s infinite' }}>
              ● their turn
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {Array.from({ length: oppDisplayCount }, (_, i) => {
            const obTurns = isOppCardObstructed(i)
              ? (oppObstacles.get(i) ?? state.opponentHandMirror[i]?.obstacleturnsLeft ?? 1)
              : 0;
            const isObst = obTurns > 0;
            const actualCard = oppFinalHand[i];
            const placeholderCard: CardData = actualCard || {
              id: -(i + 1), type: 'STANDARD', value: 0, name: '?', obstacleturnsLeft: obTurns,
            };
            const isWinner = state.gameOverResult === 'lose';
            const isDraw = state.gameOverResult === 'draw';
            const showFace = state.phase === 'over' && actualCard;
            const isWinningCard = showFace && !isSpecial(placeholderCard) && (placeholderCard.value === 6 || placeholderCard.value === 7);
            const isBlackedOut = state.phase === 'over' && (!isWinningCard || (!isWinner && !isDraw));

            return (
              <CardView
                key={`opp-${i}`}
                card={placeholderCard}
                faceDown={!showFace}
                obstructed={isObst}
                targeted={uiMode === 'choosingTarget' && hoveredOppCard === i}
                hovered={uiMode !== 'choosingTarget' && hoveredOppCard === i}
                style={{
                  filter: isBlackedOut ? 'brightness(0.2) grayscale(1)' : 'none',
                  opacity: state.phase === 'over' && isBlackedOut ? 0.4 : 1,
                  transform: 'rotate(180deg)',
                  cursor: (state.isMyTurn && uiMode === 'choosingTarget' && !isObst && state.phase !== 'over') ? 'pointer' : 'default',
                }}
                onClick={() => handleOppCardClick(i)}
                onMouseEnter={() => setHoveredOppCard(i)}
                onMouseLeave={() => setHoveredOppCard(-1)}
              />
            );
          })}
        </div>

        {uiMode === 'choosingTarget' && (
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '12px', color: '#f0c040', letterSpacing: '1px', zIndex: 12, position: 'relative' }}>
            ▲ Click an opponent card to target it ▲
          </div>
        )}
      </div>

      {/* ─── CENTER: Deck + HUD + Discard ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px', zIndex: 1 }}>
        {/* Deck pile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 115 }}>
            {[3, 2, 1, 0].map(i => (
              <div key={i} style={{ position: 'absolute', top: -i * 2, left: i * 2 }}>
                <CardView card={{ id: -100 - i, type: 'STANDARD', value: 0, name: '?', obstacleturnsLeft: 0 }} faceDown />
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#6b8c6b', marginTop: '6px', letterSpacing: '1px' }}>
            DECK · {state.deckRemaining}
          </div>
        </div>

        {/* Turn indicator + timer */}
        <div style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', color: state.isMyTurn ? '#4ade80' : '#f87171', textTransform: 'uppercase' }}>
            {state.isMyTurn ? 'Your Turn' : `${state.opponentName}'s Turn`}
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: timerWarn ? 'rgba(239,68,68,0.2)' : state.isMyTurn ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
            border: `2px solid ${timerWarn ? '#ef4444' : state.isMyTurn ? '#4ade80' : '#f59e0b'}`,
            fontSize: '22px', fontWeight: '700',
            color: timerWarn ? '#ef4444' : state.isMyTurn ? '#4ade80' : '#f59e0b',
            animation: timerWarn ? 'pulse 0.7s infinite' : 'none',
            transition: 'border-color 0.3s, color 0.3s',
          }}>
            {timeLeft}
          </div>
          {state.log[0] && (
            <div style={{ fontSize: '10px', color: '#5a7a5a', marginTop: '8px', maxWidth: '150px', lineHeight: 1.5, textAlign: 'center' }}>
              {state.log[0].slice(0, 70)}
            </div>
          )}
        </div>

        {/* ─── NEW: Discard pile ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', minWidth: 96 }}>
          <div style={{ fontSize: '11px', color: '#6b8c6b', marginBottom: '6px', letterSpacing: '1px' }}>
            DISCARD{discardTotal > 0 ? ` · ${discardTotal}` : ''}
          </div>
          {discardPile.length === 0 ? (
            <div style={{
              width: 80, height: 115, background: 'rgba(0,0,0,0.3)', borderRadius: 7,
              border: '1px dashed rgba(139,115,85,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '10px', color: '#3a2a10', letterSpacing: '1px' }}>EMPTY</span>
            </div>
          ) : (
            <div style={{ position: 'relative', width: 80, height: 115, margin: '0 auto', overflow: 'visible' }}>
              {/* Historical stack — older entries peeking behind */}
              {discardPile.slice(1, 3).map((_, si) => (
                <div key={si} style={{
                  position: 'absolute',
                  top: (si + 1) * 2, left: (si + 1) * 2,
                  zIndex: si, opacity: 0.45 - si * 0.12,
                  pointerEvents: 'none',
                }}>
                  <CardView
                    card={{ id: -8000 - si, type: 'STANDARD' as const, value: 0, name: '?', obstacleturnsLeft: 0 }}
                    faceDown
                  />
                </div>
              ))}
              {/* Most recent play — slides in with animation; key change triggers re-mount */}
              <div
                key={discardPile.length}
                style={{ position: 'absolute', inset: 0, zIndex: 10, animation: 'discardIn 0.25s ease-out' }}
              >
                {discardPile[0].cards.length === 1 ? (
                  /* Solo / special play */
                  <CardView
                    card={discardPile[0].cards[0]}
                    faceDown={discardPile[0].faceDown}
                  />
                ) : (
                  /* Pair play — fan two cards from bottom-centre */
                  <>
                    <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'bottom center', zIndex: 1 }}>
                      <CardView
                        card={discardPile[0].cards[0]}
                        faceDown={discardPile[0].faceDown}
                        style={{ transform: 'rotate(-11deg) translate(-7px, -2px)' }}
                      />
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'bottom center', zIndex: 2 }}>
                      <CardView
                        card={discardPile[0].cards[1]}
                        faceDown={discardPile[0].faceDown}
                        style={{ transform: 'rotate(11deg) translate(7px, -2px)' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────────────────── */}
      </div>

      {/* ─── OPERATION BUTTONS ─── */}
      {uiMode === 'choosingOp' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30, background: '#0a1a0a',
          border: '1px solid rgba(240,192,64,0.4)',
          borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontSize: '11px', color: '#8a7040', letterSpacing: '2.5px', marginBottom: '0.5rem' }}>
            {isValueShift ? 'SHIFT VALUE' : 'MOVE DIRECTION'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b8c6b', marginBottom: '1.25rem' }}>
            {isValueShift ? 'Target card will be shifted by 1' : 'Target card will move one slot'}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <OpButton
              label={isValueShift ? '+1' : '← Left'}
              onClick={() => handleOpButton(isMoveCard ? -1 : +1)}
              disabled={(isMoveCard && leftBlocked) || shiftPlusBlocked}
            />
            <OpButton
              label={isValueShift ? '−1' : 'Right →'}
              onClick={() => handleOpButton(isMoveCard ? +1 : -1)}
              disabled={(isMoveCard && rightBlocked) || shiftMinusBlocked}
            />
          </div>
          <button
            onClick={resetUI}
            style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#4a5a4a', cursor: 'pointer', fontSize: '12px', fontFamily: 'Georgia, serif' }}
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      {/* ─── MY HAND ─── */}
      <div style={{ width: '100%', padding: '0 24px 12px', zIndex: isTargeting ? 8 : 6 }}>
        {uiMode === 'choosingTarget' && (
          <div style={{ textAlign: 'center', marginBottom: '6px', fontSize: '12px', color: '#f0c040', letterSpacing: '1px', position: 'relative', zIndex: 12 }}>
            ▼ Or click one of your cards to target yourself ▼
          </div>
        )}
        {state.deadlockPending && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#f0c040' }}>
              ⚠ Emergency Redraw — select exactly 3 cards, then confirm
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {myDisplayHand.map((card, idx) => {
            const obs = isMyCardObstructed(idx);
            const isActiveSpecial = idx === activeSpecialIdx;
            const isSel = idx === selected1Idx || idx === selected2Idx;
            const isRedrawSel = redrawSelected.has(idx);
            const isInert = uiMode === 'choosingTarget' && (isActiveSpecial || (obs && !isSpecial(card)));
            const canTarget = uiMode === 'choosingTarget' && !isInert;
            const isHov = hoveredMyCard === idx && !isInert && state.isMyTurn;
            const isWinner = state.gameOverResult === 'win';
            const isDraw = state.gameOverResult === 'draw';
            const isWinningCard = !isSpecial(card) && (card.value === 6 || card.value === 7);
            const isBlackedOut = state.phase === 'over' && (!isWinningCard || (!isWinner && !isDraw));

            return (
              <CardView
                key={card.id}
                card={card}
                selected={isSel || isRedrawSel}
                obstructed={obs}
                targeted={canTarget && hoveredMyCard === idx}
                hovered={isHov && uiMode !== 'choosingTarget'}
                glowing={isWinCard(card) && !obs}
                style={{
                  filter: isBlackedOut ? 'brightness(0.2) grayscale(1)' : 'none',
                  opacity: isInert ? 0.3 : (state.phase === 'over' && isBlackedOut ? 0.4 : 1),
                  cursor: (!state.isMyTurn || isInert || state.phase === 'over') ? 'default' : 'pointer',
                  position: 'relative', zIndex: isHov ? 15 : isTargeting ? 10 : 'auto',
                }}
                onClick={() => {
                  if (state.deadlockPending) { toggleRedraw(idx); return; }
                  handleMyCardClick(idx);
                }}
                onMouseEnter={() => setHoveredMyCard(idx)}
                onMouseLeave={() => setHoveredMyCard(-1)}
              />
            );
          })}
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {uiMode === 'selected1' && selected1Card && (selected1Card.value === 6 || selected1Card.value === 7) && (
            <ActionButton color="#f0c040" onClick={handlePlaySolo}>
              Play {selected1Card.name} Solo ▶
            </ActionButton>
          )}
          {uiMode === 'selected2' && selected1Card && selected2Card && (
            <ActionButton color="#4ade80" onClick={handlePlayPair}>
              Confirm Play Pair ({combinedResult(selected1Card.value, selected2Card.value)}) ▶
            </ActionButton>
          )}
          {(uiMode === 'selected1' || uiMode === 'selected2') && (
            <ActionButton color="#6b8c6b" onClick={resetUI}>Deselect</ActionButton>
          )}
          {uiMode === 'choosingTarget' && (
            <ActionButton color="#6b8c6b" onClick={resetUI}>Cancel (ESC)</ActionButton>
          )}
          {uiMode === 'idle' && state.isMyTurn && !state.deadlockPending && (
            <ActionButton color="#6b8c6b" onClick={() => { send('passTurn'); }}>Pass</ActionButton>
          )}
          {state.deadlockPending && redrawSelected.size === 3 && (
            <ActionButton color="#f0c040" onClick={confirmRedraw}>Confirm Redraw ▶</ActionButton>
          )}
          {state.deadlockPending && redrawSelected.size < 3 && (
            <span style={{ fontSize: '12px', color: '#6b8c6b' }}>{redrawSelected.size}/3 selected</span>
          )}
        </div>
      </div>

      {/* ─── NEW: Coin flip overlay — shown once at game start ──────────── */}
      {showCoinFlip && state.phase === 'playing' && (
        <CoinFlipOverlay
          isHeads={state.isMyTurn}
          opponentName={state.opponentName}
          onDone={() => setShowCoinFlip(false)}
        />
      )}

      {/* Timing bar */}
      {showTimingBar && (
        <TimingBar
          timeLeft={timeLeft}
          onFire={handleTimingFire}
          onCancel={() => { setShowTimingBar(false); setTimingTarget(null); }}
        />
      )}

      <style>{`
        @font-face {
          font-family: 'SuperCartoon';
          src: url('/fonts/SuperCartoon-6R791.ttf') format('truetype');
        }
        @keyframes pulse          { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink          { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes gameOverEntrance  { from{opacity:0;transform:translateY(-16px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gameOverCardsRise { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes discardIn      { from{opacity:0;transform:translateY(-6px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes coinLandHeads  { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(1800deg)} }
        @keyframes coinLandTails  { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(1980deg)} }
        @keyframes fadeInUp       { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes coinGlow       { 0%,100%{box-shadow:0 0 30px rgba(232,184,0,0.5)} 50%{box-shadow:0 0 55px rgba(232,184,0,0.85)} }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Coin Flip Overlay
// ─────────────────────────────────────────────────────────────────────────────

const CoinFlipOverlay: React.FC<{
  isHeads: boolean;
  opponentName: string;
  onDone: () => void;
}> = ({ isHeads, opponentName, onDone }) => {
  const [phase, setPhase] = useState<'spinning' | 'result'>('spinning');
  const [canDismiss, setCanDismiss] = useState(false);

  // Keep a stable ref so the effect never needs to re-run when the parent
  // re-renders (GameBoard re-renders every second for the turn timer).
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('result'),          1950);
    const t2 = setTimeout(() => setCanDismiss(true),         2600);
    const t3 = setTimeout(() => onDoneRef.current(),         4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // ← empty: runs once on mount, timers are never reset

  const accentColor = isHeads ? '#f0c040' : '#c084fc';

  return (
    <div
      onClick={() => { if (canDismiss) onDoneRef.current(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(12,6,0,0.97) 0%, rgba(2,2,2,0.99) 100%)',
        fontFamily: 'Georgia, serif',
        cursor: canDismiss ? 'pointer' : 'default',
      }}
    >
      {/* Ambient glow that brightens once result is known */}
      <div style={{
        position: 'absolute', width: 460, height: 460, borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${accentColor}${phase === 'result' ? '20' : '08'} 0%, transparent 70%)`,
        transition: 'background 1.2s ease',
      }} />

      {/* Label */}
      <div style={{ fontSize: '11px', letterSpacing: '4px', color: 'rgba(240,192,64,0.35)', marginBottom: '2.5rem', textTransform: 'uppercase' }}>
        determining first turn
      </div>

      {/* 3-D coin */}
      <div style={{ perspective: '500px', marginBottom: '2.5rem' }}>
        <div style={{
          width: 136, height: 136,
          position: 'relative',
          transformStyle: 'preserve-3d',
          borderRadius: '50%',
          animation: phase === 'spinning'
            ? `${isHeads ? 'coinLandHeads' : 'coinLandTails'} 1.95s cubic-bezier(0.25, 0.1, 0.15, 1) forwards`
            : 'coinGlow 2s ease-in-out infinite',
        }}>
          {/* ── Front face: HEADS (you go first) ── */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 30%, #ffe76a 0%, #dba400 55%, #a07000 100%)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.35)',
            backfaceVisibility: 'hidden',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '3px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(80,40,0,0.7)', letterSpacing: '2.5px' }}>YOU</div>
            <div style={{ fontSize: '30px', fontWeight: '900', color: '#5a3000', lineHeight: 1, fontFamily: 'SuperCartoon, Georgia, serif', textShadow: '0 1px 2px rgba(255,220,100,0.5)' }}>6 7</div>
            <div style={{ fontSize: '9px', color: 'rgba(80,40,0,0.55)', letterSpacing: '2px' }}>HEADS</div>
          </div>

          {/* ── Back face: TAILS (opponent goes first) ── */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 30%, #f0d055 0%, #c89000 55%, #907000 100%)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.25)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '3px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(60,30,0,0.65)', letterSpacing: '2.5px' }}>THEM</div>
            <div style={{ fontSize: '30px', fontWeight: '900', color: '#4a2800', lineHeight: 1, fontFamily: 'SuperCartoon, Georgia, serif', textShadow: '0 1px 2px rgba(230,190,60,0.4)' }}>6 7</div>
            <div style={{ fontSize: '9px', color: 'rgba(60,30,0,0.5)', letterSpacing: '2px' }}>TAILS</div>
          </div>
        </div>
      </div>

      {/* Result text — fades in after the coin lands */}
      {phase === 'result' && (
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.55s ease-out both' }}>
          {/* Decorative rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.9rem' }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${accentColor}40)` }} />
            <span style={{ color: accentColor, fontSize: '14px' }}>{isHeads ? '★' : '◆'}</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${accentColor}40)` }} />
          </div>

          <div style={{
            fontSize: '52px', fontWeight: '700', letterSpacing: '5px',
            color: accentColor,
            textShadow: `0 0 28px ${accentColor}70, 0 2px 6px rgba(0,0,0,0.8)`,
            fontFamily: 'SuperCartoon, Georgia, serif',
            textTransform: 'uppercase',
          }}>
            {isHeads ? 'HEADS' : 'TAILS'}
          </div>

          <div style={{ fontSize: '17px', color: isHeads ? '#4ade80' : '#c8b88a', marginTop: '0.55rem', letterSpacing: '0.5px' }}>
            {isHeads ? 'You go first!' : `${opponentName} goes first!`}
          </div>
        </div>
      )}

      {canDismiss && (
        <div style={{
          position: 'absolute', bottom: '9%',
          fontSize: '11px', letterSpacing: '3px', color: '#3a4a3a',
          textTransform: 'uppercase',
          animation: 'fadeInUp 0.4s ease-out both',
        }}>
          tap to continue
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Existing helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function isWinCard(card: CardData) {
  return !isSpecial(card) && (card.value === 6 || card.value === 7);
}

const ActionButton: React.FC<{ color: string; onClick: () => void; children: React.ReactNode }> = ({ color, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 18px', background: 'transparent',
      border: `1px solid ${color}`, borderRadius: '5px',
      color, cursor: 'pointer', fontSize: '13px',
      fontFamily: 'Georgia, serif', letterSpacing: '0.5px',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = `${color}22`)}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
  >
    {children}
  </button>
);

const OpButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      padding: '10px 24px',
      background: disabled ? 'rgba(30,40,30,0.5)' : 'rgba(74,222,128,0.1)',
      border: disabled ? '1px solid rgba(100,100,100,0.2)' : '1px solid rgba(74,222,128,0.4)',
      borderRadius: '6px', color: disabled ? '#555' : '#4ade80',
      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '15px',
      fontFamily: 'Georgia, serif', minWidth: 100,
      transition: 'background 0.15s',
      opacity: disabled ? 0.4 : 1,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(74,222,128,0.25)'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; }}
  >
    {label}
  </button>
);