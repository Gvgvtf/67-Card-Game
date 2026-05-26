# Six & Seven — Card Game (Web Port)

A 2-player browser card game. Arrange exactly **[6, 7]** left-to-right in your hand to win.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Rendering | SVG cards (no external canvas lib needed) |
| Backend | Node.js + Socket.io + TypeScript |
| Comms | WebSockets (Socket.io) |

---

## Quick Start

### 1. Install

```bash
# From the project root
cd server && npm install
cd ../client && npm install
```

### 2. Run (two terminals)

**Terminal 1 — server:**
```bash
cd server
npm run dev
# Listening on :3001
```

**Terminal 2 — client:**
```bash
cd client
npm run dev
# Opens on http://localhost:5173
```

### 3. Play

1. Open **two browser tabs** (or two browsers) at `http://localhost:5173`
2. Tab 1: Enter your name → **Create Room** → note the 4-letter room code
3. Tab 2: Enter your name → **Join Room** → enter the code
4. Game starts automatically

---

## Gameplay

| Action | How |
|---|---|
| Select a card | Click it (highlights in green) |
| Play a pair | Click two adjacent cards that sum/diff/product to 6 or 7 |
| Play solo 6 or 7 | Click it once, then the "Play Solo" button |
| Play a special card | Click it, then click your target card, then choose direction |
| Pass (draw 1) | "Pass" button or let the 30s timer expire |
| Emergency redraw | Select 3 cards, click Confirm (only when deadlocked at 9 cards) |

### Special Cards

- **+1/-1 (Shift)** — Add or subtract 1 from any card's value
- **Move** — Shift any card one slot left or right
- **Obstacle** — Lock a card for 1–3 turns using the timing bar

### Win Condition

Have exactly **2 cards** in your hand: **6** on the left, **7** on the right.

---

## Project Structure

```
card-game/
├── server/
│   └── src/
│       ├── game/
│       │   ├── cards.ts      # Card + Deck logic
│       │   ├── player.ts     # Player, hand management, obstacle system
│       │   ├── room.ts       # GameRoom, resolves actions server-side
│       │   └── types.ts      # Shared types + socket event types
│       └── index.ts          # Express + Socket.io server, room registry
└── client/
    └── src/
        ├── components/
        │   ├── CardView.tsx       # SVG card renderer (all visual styles)
        │   ├── GameBoard.tsx      # Main game table + interaction logic
        │   ├── GameOverScreen.tsx # Win/lose/draw screen
        │   ├── HomeScreen.tsx     # Name entry + create/join
        │   ├── LobbyScreen.tsx    # Waiting room with room code
        │   └── TimingBar.tsx      # Obstacle timing mini-game
        ├── hooks/
        │   └── useSocket.ts       # Socket.io event wiring → React state
        ├── types/
        │   └── game.ts            # Client-side types + helpers
        ├── App.tsx                # Phase router (home/lobby/playing/over)
        └── main.tsx               # React entry
```

---

## Deployment (Optional)

**Server** — any Node.js host (Railway, Fly.io, Render free tier):
```bash
cd server && npm run build
node dist/index.js
```

**Client** — set `VITE_SERVER_URL` env var to your server URL, then:
```bash
cd client
VITE_SERVER_URL=https://your-server.railway.app npm run build
# Deploy the dist/ folder to Vercel / Netlify
```
