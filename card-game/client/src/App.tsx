import React, { useState, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import { GameState, emptyGameState } from './types/game';

export default function App() {
  const [state, setState] = useState<GameState>(emptyGameState());
  const { send } = useSocket(setState);

  const handleCreateRoom = useCallback((name: string) => {
    // Store myName in state before the socket round-trip
    setState(s => ({ ...s, myName: name }));
    send('createRoom', name);
  }, [send]);

  const handleJoinRoom = useCallback((name: string, code: string) => {
    setState(s => ({ ...s, myName: name }));
    send('joinRoom', { name, roomCode: code });
  }, [send]);

  const handlePlayAgain = useCallback(() => {
    setState(emptyGameState());
  }, []);

  // Called by GameBoard when the player confirms emergency redraw
  const handleClearDeadlock = useCallback(() => {
    setState(s => ({ ...s, deadlockPending: false }));
  }, []);

  return (
    <>
      {state.phase === 'home' && (
        <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}
      {state.phase === 'lobby' && (
        <LobbyScreen state={state} />
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
