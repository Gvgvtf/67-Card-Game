export type CardType = 'STANDARD' | 'VALUE_SHIFT' | 'MOVE_CARD' | 'OBSTACLE';

export interface CardData {
  id: number;
  type: CardType;
  value: number;
  name: string;
  obstacleturnsLeft: number;
}

export interface GameAction {
  card: CardData;
  playerName: string;
  message: string;
  pass: boolean;
  targetOwner: 'self' | 'opponent' | '';
  targetIndex: number;
  delta: number;
}

export interface PlayerState {
  name: string;
  hand: CardData[];
  deckRemaining: number;
}

export type GamePhase = 'waiting' | 'playing' | 'over';

export interface RoomState {
  roomCode: string;
  phase: GamePhase;
  players: { socketId: string; name: string }[];
  currentTurn: number;
  winner?: string;
}

// Socket event payloads
export interface ServerToClientEvents {
  roomJoined: (data: { roomCode: string; playerIndex: number; opponentName?: string }) => void;
  opponentJoined: (data: { name: string }) => void;
  gameStart: (data: { myHand: CardData[]; opponentHandSize: number; opponentName: string }) => void;
  yourTurn: (data: { hand: CardData[]; deckRemaining: number; obstacleData: string }) => void;
  opponentTurn: (data: { opponentName: string; opponentHandSize: number; obstacleData: string }) => void;
  actionBroadcast: (action: GameAction) => void;
  handUpdate: (data: { hand: CardData[]; deckRemaining: number }) => void;
  opponentHandSize: (size: number) => void;
  opponentHand: (hand: CardData[]) => void;
  myObstacles: (data: string) => void;
  oppObstacles: (data: string) => void;
  gameOver: (data: { winner: string; winnerHand: CardData[]; loserName: string; loserHand: CardData[] }) => void;
  gameDraw: (data: { hand1: CardData[]; name1: string; hand2: CardData[]; name2: string }) => void;
  deadlockRedraw: (hand: CardData[]) => void;
  redrawDone: (data: { who: string; log: string }) => void;
  error: (msg: string) => void;
  opponentDisconnected: () => void;
}

export interface ClientToServerEvents {
  createRoom: (name: string) => void;
  joinRoom: (data: { roomCode: string; name: string }) => void;
  joinBot: (name: string) => void;
  playCard: (index: number) => void;
  playPair: (data: { first: number; second: number }) => void;
  specialAction: (data: { cardIdx: number; targetOwner: string; targetIdx: number; delta: number }) => void;
  passTurn: () => void;
  requestOpponentHand: () => void;
  emergencyRedraw: (indices: number[]) => void;
}
