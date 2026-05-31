import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, CardData } from '../types/game';

type SetState = React.Dispatch<React.SetStateAction<GameState>>;

export function useSocket(setState: SetState) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.on('roomJoined', ({ roomCode, playerIndex, opponentName }) => {
      setState(s => ({
        ...s,
        phase: 'lobby',
        roomCode,
        playerIndex,
        opponentName: opponentName ?? '',
      }));
    });

    socket.on('opponentJoined', ({ name }) => {
      setState(s => ({ ...s, opponentName: name }));
    });

    socket.on('gameStart', ({ myHand, opponentHandSize, opponentName }) => {
      setState(s => ({
        ...s,
        phase: 'playing',
        myHand,
        opponentHandSize,
        opponentName,
        opponentHandMirror: [],
        isMyTurn: false,
        myObstacles: '',
        oppObstacles: '',
        deadlockPending: false,
        opponentLastDiscard: [],
        log: ['Game started! Arrange [6, 7] to win.'],
      }));
    });

    socket.on('yourTurn', ({ hand, deckRemaining, obstacleData }) => {
      setState(s => ({
        ...s,
        myHand: hand,
        deckRemaining,
        myObstacles: obstacleData ?? '',
        isMyTurn: true,
        opponentHandMirror: [],
        deadlockPending: false,
        // Don't clear opponentLastDiscard here — let the discard effect in
        // GameBoard consume it first; it will be cleared on the next opponent play.
      }));
    });

    socket.on('opponentTurn', ({ opponentName, opponentHandSize, obstacleData }) => {
      setState(s => ({
        ...s,
        opponentName,
        opponentHandSize,
        oppObstacles: obstacleData ?? '',
        isMyTurn: false,
        opponentHandMirror: [],
      }));
    });

    socket.on('handUpdate', ({ hand, deckRemaining }) => {
      setState(s => ({ ...s, myHand: hand, deckRemaining }));
    });

    socket.on('opponentHandSize', (size: number) => {
      setState(s => ({ ...s, opponentHandSize: size, opponentHandMirror: [] }));
    });

    socket.on('opponentHand', (hand: CardData[]) => {
      setState(s => ({ ...s, opponentHandMirror: hand }));
    });

    socket.on('myObstacles', (data: string) => {
      setState(s => ({ ...s, myObstacles: data ?? '' }));
    });

    socket.on('oppObstacles', (data: string) => {
      setState(s => ({ ...s, oppObstacles: data ?? '' }));
    });

    // FIX 2 (multiplayer): server emits the cards the opponent just played
    // so we can show them face-up in the discard pile.
    // Add to your server: socket.to(opponentSocketId).emit('opponentPlayed', discardedCards)
    // whenever a player plays a pair or solo card.
    socket.on('opponentPlayed', (cards: CardData[]) => {
      setState(s => ({ ...s, opponentLastDiscard: cards }));
    });

    socket.on('gameOver', ({ winner, winnerHand, loserName, loserHand }) => {
      setState(s => ({
        ...s,
        phase: 'over',
        isMyTurn: false,
        gameOverResult: winner === s.myName ? 'win' : 'lose',
        winnerHand: winnerHand ?? [],
        loserHand: loserHand ?? [],
        loserName: loserName ?? '',
      }));
    });

    socket.on('gameDraw', ({ hand1, name1, hand2, name2 }) => {
      setState(s => ({
        ...s,
        phase: 'over',
        isMyTurn: false,
        gameOverResult: 'draw',
        winnerHand: name1 === s.myName ? hand1 : hand2,
        loserHand: name1 === s.myName ? hand2 : hand1,
        loserName: name1 === s.myName ? name2 : name1,
      }));
    });

    socket.on('deadlockRedraw', (hand: CardData[]) => {
      setState(s => ({ ...s, myHand: hand, deadlockPending: true }));
    });

    socket.on('error', (msg: string) => {
      setState(s => ({ ...s, log: [`Error: ${msg}`, ...s.log].slice(0, 20) }));
    });

    socket.on('opponentDisconnected', () => {
      setState(s => ({
        ...s,
        phase: 'over',
        isMyTurn: false,
        gameOverResult: 'win',
        log: ['Opponent disconnected — you win!', ...s.log],
      }));
    });

    return () => { socket.disconnect(); };
  }, [setState]);

  const send = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { send };
}