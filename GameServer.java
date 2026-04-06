import java.io.*;
import java.net.*;
import java.util.*;

/**
 * GameServer — manages the card game.
 * Win condition: first player whose hand is exactly [6, 7] (left to right) wins.
 */
public class GameServer {

    private static final int PORT        = 5000;
    private static final int MAX_PLAYERS = 2;

    private ServerSocket        serverSocket;
    private List<ClientHandler> clients;
    private boolean             running;
    private boolean             gameStarted;
    private int                 currentTurn;

    public GameServer() {
        clients     = new ArrayList<>();
        running     = false;
        gameStarted = false;
        currentTurn = 0;
    }

    // Starts the server and waits for both players to connect before starting the game.
    public void start() {
        try {
            serverSocket = new ServerSocket(PORT);
            running      = true;
            System.out.println("Card Game Server started on port " + PORT);

            while (running && clients.size() < MAX_PLAYERS) {
                Socket socket   = serverSocket.accept();
                ClientHandler h = new ClientHandler(socket, this, clients.size());
                clients.add(h);
                new Thread(h).start();
                System.out.println("Player " + clients.size() + " connected.");
                if (clients.size() == MAX_PLAYERS) startGame();
            }
        } catch (IOException e) {
            if (running) System.err.println("Server error: " + e.getMessage());
        }
    }

    // Initializes the game state and notifies clients to start the game.
    private void startGame() {
        gameStarted = true;

        // Deal initial hands
        for (ClientHandler c : clients) c.getPlayer().dealInitialHand();

        broadcast("GAME_START", null);

        // Send each client their player index and opponent's name for UI purposes.
        for (int i = 0; i < clients.size(); i++) {
            ClientHandler c   = clients.get(i);
            ClientHandler opp = clients.get(1 - i);
            c.sendMessage("YOUR_INDEX|" + i);
            c.sendMessage("OPPONENT_NAME|" + opp.getPlayerName());
        }

        advanceTurn(-1);
    }

    /**
     * Resolves any action sent by a client.
     * After resolution, checks win condition then advances the turn.
     */

    public synchronized void resolveAction(GameAction action, int senderIndex) {
        if (senderIndex != currentTurn) {
            clients.get(senderIndex).sendMessage("ERROR|Not your turn.");
            return;
        }

        ClientHandler sender   = clients.get(senderIndex);
        ClientHandler opponent = clients.get(1 - senderIndex);

        if (action.isPass()) {
            broadcast(action.serialize(), null);
            checkWinThenAdvance(senderIndex);
            return;
        }

        Card.CardType type = action.getCard().getType();

        if (type == Card.CardType.VALUE_SHIFT) {
            Player target = action.getTargetOwner().equals(GameAction.TARGET_SELF)
                          ? sender.getPlayer() : opponent.getPlayer();

            String log = target.applyValueShift(action.getTargetIndex(), action.getDelta());
            action.setMessage(action.getMessage() + " " + log);

        } else if (type == Card.CardType.MOVE_CARD) {
            Player target = action.getTargetOwner().equals(GameAction.TARGET_SELF)
                          ? sender.getPlayer() : opponent.getPlayer();

            String log = target.applyMoveCard(action.getTargetIndex(), action.getDelta());
            action.setMessage(action.getMessage() + " " + log);
        }

        broadcast(action.serialize(), null);
        checkWinThenAdvance(senderIndex);
    }

    private void checkWinThenAdvance(int senderIndex) {
        ClientHandler sender   = clients.get(senderIndex);
        ClientHandler opponent = clients.get(1 - senderIndex);

        if (sender.getPlayer().hasWon()) {
            broadcast("GAME_OVER|" + sender.getPlayerName(), null);
            running = false;
            return;
        }
        if (opponent.getPlayer().hasWon()) {
            broadcast("GAME_OVER|" + opponent.getPlayerName(), null);
            running = false;
            return;
        }

        advanceTurn(senderIndex);
    }

    private void advanceTurn(int lastIndex) {
        currentTurn = (lastIndex + 1) % MAX_PLAYERS;
        ClientHandler active  = clients.get(currentTurn);
        ClientHandler waiting = clients.get(1 - currentTurn);

        String log = active.getPlayer().startTurn();
        System.out.println(log);

        // Send each player their updated hand
        active.sendMessage("YOUR_TURN|"
            + active.getPlayer().serializeHand() + "|"
            + active.getPlayer().getDeckRemaining());

        waiting.sendMessage("OPPONENT_TURN|"
            + active.getPlayer().getName() + "|"
            + opponent_hand_size(active));
    }

    private int opponent_hand_size(ClientHandler active) {
        return active.getPlayer().getHand().size();
    }

    public synchronized void broadcast(String msg, ClientHandler exclude) {
        for (ClientHandler c : clients) {
            if (c != exclude) c.sendMessage(msg);
        }
    }

    public synchronized void removeClient(ClientHandler c) {
        clients.remove(c);
        if (gameStarted) broadcast("PLAYER_DISCONNECTED|" + c.getPlayerName(), null);
    }

    public static void main(String[] args) {
        new GameServer().start();
    }

    static class ClientHandler implements Runnable {

        private Socket         socket;
        private GameServer     server;
        private int            playerIndex;
        private PrintWriter    out;
        private BufferedReader in;
        private Player         player;
        private String         playerName;

        public ClientHandler(Socket socket, GameServer server, int index) {
            this.socket      = socket;
            this.server      = server;
            this.playerIndex = index;
        }

        @Override
        public void run() {
            try {
                in  = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                out = new PrintWriter(socket.getOutputStream(), true);

                playerName = in.readLine();
                player     = new Player(playerName);
                System.out.println("Registered: " + playerName);

                String msg;
                while ((msg = in.readLine()) != null) {
                    handleMessage(msg);
                }
            } catch (IOException e) {
                System.err.println("Client error (" + playerName + "): " + e.getMessage());
            } finally {
                server.removeClient(this);
                try { socket.close(); } catch (IOException ignored) {}
            }
        }

        private void handleMessage(String msg) {
            if (msg.startsWith("PLAY_CARD|")) {
                int idx = Integer.parseInt(msg.split("\\|")[1]);
                if (idx < 0 || idx >= player.getHand().size()) return;
                Card card = player.getHand().get(idx);
                GameAction action;
                if (card.getType() == Card.CardType.STANDARD) {
                    action = player.selectStandardCard(idx);
                    if (action != null) server.resolveAction(action, playerIndex);
                }

            } else if (msg.startsWith("PLAY_PAIR|")) {
                String[] p = msg.split("\\|");
                int first  = Integer.parseInt(p[1]);
                int second = Integer.parseInt(p[2]);
                player.selectStandardCard(first);
                GameAction action = player.selectSecondCard(second);
                if (action != null) server.resolveAction(action, playerIndex);

            } else if (msg.startsWith("SPECIAL_ACTION|")) {
                String[] p        = msg.split("\\|");
                int  cardIdx      = Integer.parseInt(p[1]);
                String targetOwner = p[2];
                int  targetIdx    = Integer.parseInt(p[3]);
                int  delta        = Integer.parseInt(p[4]);

                Card played = player.playSpecialCard(cardIdx);
                if (played == null) return;

                GameAction action = new GameAction(played, playerName);
                action.setTargetOwner(targetOwner);
                action.setTargetIndex(targetIdx);
                action.setDelta(delta);
                action.setMessage(playerName + " plays " + played.getName() + ".");
                server.resolveAction(action, playerIndex);

            } else if (msg.equals("REQUEST_OPPONENT_HAND")) {

                // Send the opponent's hand to this client for targeting UI
                if (server.clients.size() == 2) {
                    ClientHandler opp = server.clients.get(1 - playerIndex);
                    sendMessage("OPPONENT_HAND|" + opp.getPlayer().serializeHand());
                }
            } else if (msg.equals("PASS_TURN")) {
                GameAction action = player.passTurn();
                server.resolveAction(action, playerIndex);
            }
        }

        public void   sendMessage(String msg) { if (out != null) out.println(msg); }
        public Player getPlayer()             { return player; }
        public String getPlayerName()         { return playerName; }
    }
}