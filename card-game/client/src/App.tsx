import React, { useState, useCallback } from 'react';
import { HomeScreen, Difficulty } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import { useCpuGame } from './hooks/useCpuGame';
import { GameState, emptyGameState } from './types/game';

export default function App() {
  // ── Multiplayer state (unchanged) ─────────────────────────────────────────
  const [mpState, setMpState] = useState<GameState>(emptyGameState());
  const { send: mpSend } = useSocket(setMpState);

  // ── CPU mode state ─────────────────────────────────────────────────────────
  const [cpuMode, setCpuMode] = useState(false);
  const { state: cpuState, send: cpuSend, startGame, resetGame, clearDeadlock: cpuClearDeadlock } = useCpuGame();

  // ── Active state / send: one of the two depending on mode ─────────────────
  const state  = cpuMode ? cpuState  : mpState;
  const send   = cpuMode ? cpuSend   : mpSend;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateRoom = useCallback((name: string) => {
    setCpuMode(false);
    setMpState(s => ({ ...s, myName: name }));
    mpSend('createRoom', name);
  }, [mpSend]);

  const handleJoinRoom = useCallback((name: string, code: string) => {
    setCpuMode(false);
    setMpState(s => ({ ...s, myName: name }));
    mpSend('joinRoom', { name, roomCode: code });
  }, [mpSend]);

  const handlePlayVsCPU = useCallback((name: string, difficulty: Difficulty) => {
    setCpuMode(true);
    startGame(name, difficulty);
  }, [startGame]);

  /** "Play Again" from the game-over screen */
  const handlePlayAgain = useCallback(() => {
    if (cpuMode) {
      // Return to home so the player can choose difficulty again
      resetGame();
      setCpuMode(false);
    } else {
      setMpState(emptyGameState());
    }
  }, [cpuMode, resetGame]);

  /** Back button in the lobby (multiplayer) or any early exit */
  const handleBackToHome = useCallback(() => {
    setMpState(emptyGameState());
    resetGame();
    setCpuMode(false);
  }, [resetGame]);

  const handleClearDeadlock = useCallback(() => {
    if (cpuMode) {
      cpuClearDeadlock();
    } else {
      setMpState(s => ({ ...s, deadlockPending: false }));
    }
  }, [cpuMode, cpuClearDeadlock]);

  // ── Routing (identical structure to original) ─────────────────────────────

  return (
    <>
      {state.phase === 'home' && (
        <HomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onPlayVsCPU={handlePlayVsCPU}
        />
      )}

      {state.phase === 'lobby' && (
        <LobbyScreen state={state} onBack={handleBackToHome} />
      )}

      {(state.phase === 'playing' || state.phase === 'over') && (
        <GameBoard
          state={state}
          send={send}
          onClearDeadlock={handleClearDeadlock}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}