import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameRoom } from './game/room';
import { INITIAL_HAND } from './game/player';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const rooms = new Map<string, GameRoom>();
const socketToRoom = new Map<string, { roomCode: string; playerIndex: number }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateRoomCode() : code;
}

function notifyTurnStart(room: GameRoom) {
  const active = room.getPlayer(room.currentTurn);
  const waiting = room.getOpponent(room.currentTurn);

  io.to(active.socketId).emit('yourTurn', {
    hand: active.player.serializeHand(),
    deckRemaining: active.player.getDeckRemaining(),
    obstacleData: active.player.serializeObstacles(),
  });

  io.to(waiting.socketId).emit('opponentTurn', {
    opponentName: active.name,
    opponentHandSize: active.player.hand.length,
    obstacleData: active.player.serializeObstacles(),
  });

  // Push full obstacle state to ensure both myObstacles and oppObstacles are correctly synced
  pushObstacleUpdates(room, room.currentTurn);

  if (active.player.isHandDeadlocked()) {
    active.awaitingRedraw = true;
    io.to(active.socketId).emit('deadlockRedraw', active.player.serializeHand());
  }
}

function pushObstacleUpdates(room: GameRoom, senderIndex: number) {
  const sender = room.getPlayer(senderIndex);
  const opponent = room.getOpponent(senderIndex);
  // Push obstacle state to both players immediately after a special card
  // so lock overlays appear before the next yourTurn/opponentTurn message
  io.to(sender.socketId).emit('myObstacles', sender.player.serializeObstacles());
  io.to(sender.socketId).emit('oppObstacles', opponent.player.serializeObstacles());
  io.to(opponent.socketId).emit('myObstacles', opponent.player.serializeObstacles());
  io.to(opponent.socketId).emit('oppObstacles', sender.player.serializeObstacles());
}

function checkWinAndAdvance(
  room: GameRoom,
  senderIndex: number,
  result: { senderWon?: boolean; opponentWon?: boolean }
) {
  const sender = room.getPlayer(senderIndex);
  const opponent = room.getOpponent(senderIndex);

  if (result.senderWon && result.opponentWon) {
    room.phase = 'over';
    const payload = {
      name1: sender.name, hand1: sender.player.serializeHand(),
      name2: opponent.name, hand2: opponent.player.serializeHand(),
    };
    io.to(sender.socketId).emit('gameDraw', payload);
    io.to(opponent.socketId).emit('gameDraw', payload);
    return;
  }

  const winner = result.senderWon ? sender : result.opponentWon ? opponent : null;
  const loser = winner === sender ? opponent : sender;
  if (winner) {
    room.phase = 'over';
    const payload = {
      winner: winner.name,
      winnerHand: winner.player.serializeHand(),
      loserName: loser.name,
      loserHand: loser.player.serializeHand(),
    };
    io.to(sender.socketId).emit('gameOver', payload);
    io.to(opponent.socketId).emit('gameOver', payload);
    return;
  }

  room.advanceTurn(senderIndex);
  notifyTurnStart(room);
}

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on('createRoom', (name: string) => {
    if (!name || typeof name !== 'string') return;
    const roomCode = generateRoomCode();
    const room = new GameRoom(roomCode);
    rooms.set(roomCode, room);
    const playerIndex = room.addPlayer(socket.id, name.trim().slice(0, 20));
    socketToRoom.set(socket.id, { roomCode, playerIndex });
    socket.join(roomCode);
    socket.emit('roomJoined', { roomCode, playerIndex });
  });

  socket.on('joinRoom', ({ roomCode, name }: { roomCode: string; name: string }) => {
    if (!roomCode || !name) return;
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) { socket.emit('error', 'Room not found. Check the code and try again.'); return; }
    if (room.isFull()) { socket.emit('error', 'Room is already full.'); return; }
    if (room.phase !== 'waiting') { socket.emit('error', 'Game already in progress.'); return; }

    const playerIndex = room.addPlayer(socket.id, name.trim().slice(0, 20));
    socketToRoom.set(socket.id, { roomCode: code, playerIndex });
    socket.join(code);

    const host = room.getPlayer(0);
    socket.emit('roomJoined', { roomCode: code, playerIndex, opponentName: host.name });
    io.to(host.socketId).emit('opponentJoined', { name: name.trim().slice(0, 20) });

    // Start game
    room.startGame();
    const p0 = room.getPlayer(0);
    const p1 = room.getPlayer(1);

    io.to(p0.socketId).emit('gameStart', {
      myHand: p0.player.serializeHand(),
      opponentHandSize: p1.player.hand.length,
      opponentName: p1.name,
    });
    io.to(p1.socketId).emit('gameStart', {
      myHand: p1.player.serializeHand(),
      opponentHandSize: p0.player.hand.length,
      opponentName: p0.name,
    });

    room.currentTurn = 0;
    notifyTurnStart(room);
  });

  socket.on('passTurn', () => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'playing') return;
    if (room.currentTurn !== info.playerIndex) return;

    const result = room.resolvePass(info.playerIndex);
    if (result.error) { socket.emit('error', result.error); return; }

    // Send updated hands/sizes to both players immediately
    const opponent = room.getOpponent(info.playerIndex);
    const sender = room.getPlayer(info.playerIndex);
    socket.emit('handUpdate', { hand: sender.player.serializeHand(), deckRemaining: sender.player.getDeckRemaining() });
    io.to(opponent.socketId).emit('opponentHandSize', sender.player.hand.length);
    socket.emit('opponentHandSize', opponent.player.hand.length);

    checkWinAndAdvance(room, info.playerIndex, result);
  });

  socket.on('playCard', (index: unknown) => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'playing') return;
    if (room.currentTurn !== info.playerIndex) return;
    if (typeof index !== 'number') return;

    const result = room.resolvePlayCard(info.playerIndex, index);
    if (result.error) { socket.emit('error', result.error); return; }

    const opponent = room.getOpponent(info.playerIndex);
    const sender = room.getPlayer(info.playerIndex);
    socket.emit('handUpdate', { hand: sender.player.serializeHand(), deckRemaining: sender.player.getDeckRemaining() });
    io.to(opponent.socketId).emit('opponentHandSize', sender.player.hand.length);
    socket.emit('opponentHandSize', opponent.player.hand.length);

    checkWinAndAdvance(room, info.playerIndex, result);
  });

  socket.on('playPair', ({ first, second }: { first: number; second: number }) => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'playing') return;
    if (room.currentTurn !== info.playerIndex) return;

    const result = room.resolvePlayPair(info.playerIndex, first, second);
    if (result.error) { socket.emit('error', result.error); return; }

    const opponent = room.getOpponent(info.playerIndex);
    const sender = room.getPlayer(info.playerIndex);
    socket.emit('handUpdate', { hand: sender.player.serializeHand(), deckRemaining: sender.player.getDeckRemaining() });
    io.to(opponent.socketId).emit('opponentHandSize', sender.player.hand.length);
    socket.emit('opponentHandSize', opponent.player.hand.length);

    checkWinAndAdvance(room, info.playerIndex, result);
  });

  socket.on('specialAction', (payload: unknown) => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'playing') return;
    if (room.currentTurn !== info.playerIndex) return;

    // Validate payload shape
    if (
      typeof payload !== 'object' || payload === null ||
      typeof (payload as any).cardIdx !== 'number' ||
      typeof (payload as any).targetOwner !== 'string' ||
      typeof (payload as any).targetIdx !== 'number' ||
      typeof (payload as any).delta !== 'number'
    ) return;

    const { cardIdx, targetOwner, targetIdx, delta } = payload as {
      cardIdx: number; targetOwner: string; targetIdx: number; delta: number;
    };

    const result = room.resolveSpecialAction(info.playerIndex, cardIdx, targetOwner, targetIdx, delta);
    if (result.error) { socket.emit('error', result.error); return; }

    // Push obstacle state to both players immediately so lock overlays update
    pushObstacleUpdates(room, info.playerIndex);

    // Push updated hands to both players (value shift, move may change hand content)
    const sender = room.getPlayer(info.playerIndex);
    const opponent = room.getOpponent(info.playerIndex);
    socket.emit('handUpdate', { hand: sender.player.serializeHand(), deckRemaining: sender.player.getDeckRemaining() });
    io.to(opponent.socketId).emit('handUpdate', { hand: opponent.player.serializeHand(), deckRemaining: opponent.player.getDeckRemaining() });
    io.to(opponent.socketId).emit('opponentHandSize', sender.player.hand.length);
    socket.emit('opponentHandSize', opponent.player.hand.length);

    checkWinAndAdvance(room, info.playerIndex, result);
  });

  socket.on('requestOpponentHand', () => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    // Only honour if it's genuinely this player's turn
    if (!room || room.currentTurn !== info.playerIndex) return;
    const opponent = room.getOpponent(info.playerIndex);
    socket.emit('opponentHand', opponent.player.serializeHand());
  });

  socket.on('emergencyRedraw', (indices: unknown) => {
    const info = socketToRoom.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    const rp = room.getPlayer(info.playerIndex);
    if (!rp.awaitingRedraw) { socket.emit('error', 'No emergency redraw available.'); return; }

    // Validate indices
    if (!Array.isArray(indices) || indices.some(i => typeof i !== 'number')) {
      socket.emit('error', 'Invalid redraw indices.'); return;
    }

    rp.awaitingRedraw = false;
    rp.player.applyEmergencyRedraw(indices as number[]);
    socket.emit('handUpdate', {
      hand: rp.player.serializeHand(),
      deckRemaining: rp.player.getDeckRemaining(),
    });
    // Advance turn after redraw
    notifyTurnStart(room);
  });

  socket.on('disconnect', () => {
    const info = socketToRoom.get(socket.id);
    if (info) {
      const room = rooms.get(info.roomCode);
      if (room && room.phase !== 'over') {
        for (const p of room.players) {
          if (p.socketId !== socket.id) {
            io.to(p.socketId).emit('opponentDisconnected');
          }
        }
        rooms.delete(info.roomCode);
      }
      socketToRoom.delete(socket.id);
    }
    console.log(`[-] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`));
