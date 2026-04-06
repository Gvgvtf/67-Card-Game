import java.io.*;
import java.net.*;
import java.util.ArrayList;
import java.util.List;

// NetworkClient — manages the socket connection on the player's side.

public class NetworkClient {

    private static final String HOST = "localhost";
    private static final int    PORT = 5000;

    private Socket         socket;
    private PrintWriter    out;
    private BufferedReader in;
    private boolean        connected;

    public NetworkClient() { connected = false; }

    public boolean connect(String playerName) {
        try {
            socket    = new Socket(HOST, PORT);
            out       = new PrintWriter(socket.getOutputStream(), true);
            in        = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            connected = true;
            out.println(playerName);
            return true;
        } catch (IOException e) {
            System.err.println("Could not connect: " + e.getMessage());
            return false;
        }
    }

    public void sendMessage(String msg) {
        if (connected && out != null) out.println(msg);
    }

    public void startListening(GameFrame gameFrame, Player player) {
        Thread t = new Thread(() -> {
            try {
                String msg;
                while ((msg = in.readLine()) != null) {
                    handleServerMessage(msg, gameFrame, player);
                }
            } catch (IOException e) {
                System.err.println("Disconnected.");
                javax.swing.SwingUtilities.invokeLater(() ->
                    gameFrame.getGameCanvas().appendLog("Disconnected from server."));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    private void handleServerMessage(String msg, GameFrame frame, Player player) {
        GameCanvas canvas = frame.getGameCanvas();

        if (msg.equals("GAME_START")) {
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.appendLog("Game started! First to arrange 6 (left) and 7 (right) wins!"));

        } else if (msg.startsWith("YOUR_INDEX|")) {

        } else if (msg.startsWith("OPPONENT_NAME|")) {
            String oppName = msg.split("\\|")[1];
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.setOpponentInfo(oppName, 7));

        } else if (msg.startsWith("YOUR_TURN|")) {
            // YOUR_TURN|<serializedHand>|<deckRemaining>
            String[] parts   = msg.split("\\|", 3);
            String   handData = parts[1];
            updateHandFromServer(player, handData);
            javax.swing.SwingUtilities.invokeLater(() -> {
                canvas.setMyTurn(true);
                canvas.appendLog("Your turn! Hand: " + player.getHand().size() + " cards.");
                frame.refresh();
            });

        } else if (msg.startsWith("OPPONENT_TURN|")) {
            // OPPONENT_TURN|<opponentName>|<opponentHandSize>
            String[] parts   = msg.split("\\|");
            String   oppName = parts[1];
            int      oppSize = Integer.parseInt(parts[2]);
            javax.swing.SwingUtilities.invokeLater(() -> {
                canvas.setMyTurn(false);
                canvas.setOpponentInfo(oppName, oppSize);
                canvas.appendLog(oppName + "'s turn.");
                frame.refresh();
            });

        } else if (msg.startsWith("ACTION|")) {
            GameAction action = GameAction.deserialize(msg);
            javax.swing.SwingUtilities.invokeLater(() -> {
                canvas.appendLog(action.getMessage());
                frame.refresh();
            });

        /**
        * Sent when this player requests opponent hand for targeting
        * Format: OPPONENT_HAND|<serializedHand>
        */
       
        } else if (msg.startsWith("OPPONENT_HAND|")) {
            String handData = msg.split("\\|", 2)[1];
            List<Card> oppCards = deserializeHand(handData);
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.setOpponentHandMirror(oppCards));

        } else if (msg.startsWith("GAME_OVER|")) {
            String winner = msg.split("\\|")[1];
            String result = winner.equals(player.getName()) ? "YOU WIN! 🎉" : "YOU LOSE...";
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.showGameOver(result));

        } else if (msg.startsWith("PLAYER_DISCONNECTED|")) {
            String who = msg.split("\\|")[1];
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.appendLog(who + " disconnected."));

        } else if (msg.startsWith("ERROR|")) {
            javax.swing.SwingUtilities.invokeLater(() ->
                canvas.appendLog("Error: " + msg.split("\\|")[1]));
        }
    }

    private void updateHandFromServer(Player player, String handData) {
        player.getHand().clear();
        for (Card c : deserializeHand(handData)) player.getHand().add(c);
    }

    private List<Card> deserializeHand(String handData) {
        List<Card> cards = new ArrayList<>();
        if (handData == null || handData.isEmpty()) return cards;
        for (String s : handData.split(",")) {
            try { cards.add(Card.deserialize(s)); }
            catch (Exception ignored) {}
        }
        return cards;
    }

    public boolean isConnected() { return connected; }
}