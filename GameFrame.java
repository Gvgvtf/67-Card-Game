import javax.swing.*;
import java.awt.event.*;

/**
 * GameFrame — main JFrame. Wires all mouse interactions to the correct
 * game actions and sends messages to the server via NetworkClient.
 */
public class GameFrame extends JFrame {

    private GameCanvas    gameCanvas;
    private Player        player;
    private NetworkClient network;

    public GameFrame(Player player, NetworkClient network) {
        this.player  = player;
        this.network = network;
        initFrame();
    }

    private void initFrame() {
        setTitle("Card Battle — " + player.getName());
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(false);

        gameCanvas = new GameCanvas(player);
        add(gameCanvas);

        gameCanvas.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                handleClick(e.getX(), e.getY());
            }
        });

        pack();
        setLocationRelativeTo(null);
        setVisible(true);
        gameCanvas.requestFocusInWindow();
    }

    /**
     * Central click dispatcher. Handles all game interaction phases:
     *   1. Operation button selection (during special card targeting)
     *   2. Target selection (own card or opponent card)
     *   3. Normal play (standard cards, special card initiation, pass)
     */
    private void handleClick(int mx, int my) {
        if (!gameCanvas.isMyTurn()) return;

        // ── Phase: choosing operation (+1/-1 or ←/→) ─────────────────────────
        if (gameCanvas.isChoosingOp()) {
            int opResult = gameCanvas.getOperationButtonAt(mx, my);
            if (opResult != 0) {
                // opResult: +1 or -1
                int specialIdx   = gameCanvas.getActiveSpecialIndex();
                String owner     = gameCanvas.getChosenTargetOwner();
                int targetIdx    = gameCanvas.getChosenTargetIndex();

                network.sendMessage("SPECIAL_ACTION|"
                    + specialIdx + "|" + owner + "|" + targetIdx + "|" + opResult);
                gameCanvas.cancelSpecial();
                gameCanvas.clearOpponentMirror();
                gameCanvas.setMyTurn(false);
            }
            // Clicking outside buttons does nothing — player must choose
            return;
        }

        // ── Phase: choosing target card ───────────────────────────────────────
        if (gameCanvas.isChoosingTarget()) {
            // Check opponent's row first
            int oppIdx = gameCanvas.getOpponentCardIndexAt(mx, my);
            if (oppIdx >= 0) {
                gameCanvas.confirmTarget(GameAction.TARGET_OPPONENT, oppIdx);
                return;
            }
            // Check own row
            int ownIdx = gameCanvas.getCardIndexAt(mx, my);
            if (ownIdx >= 0) {
                gameCanvas.confirmTarget(GameAction.TARGET_SELF, ownIdx);
                return;
            }
            // Clicked empty space — cancel special
            gameCanvas.cancelSpecial();
            gameCanvas.clearOpponentMirror();
            return;
        }

        // ── Phase: normal play ────────────────────────────────────────────────

        // Pass button
        if (gameCanvas.isPassButtonAt(mx, my)) {
            network.sendMessage("PASS_TURN");
            gameCanvas.setMyTurn(false);
            return;
        }

        int idx = gameCanvas.getCardIndexAt(mx, my);
        if (idx < 0) return;

        Card clicked = player.getHand().get(idx);

        // Special card: begin two-step targeting
        if (clicked.isSpecial()) {
            gameCanvas.startSpecialTargeting(idx, clicked);
            // Ask network to mirror opponent hand so targeting is visible
            network.sendMessage("REQUEST_OPPONENT_HAND");
            return;
        }

        // Standard card: two-step combination logic
        if (player.hasPending()) {
            int firstIdx = player.getPendingIndex();
            int result   = Player.combinedResult(
                               player.getPendingCard().getValue(),
                               clicked.getValue());
            if (result != -1 && idx != firstIdx) {
                network.sendMessage("PLAY_PAIR|" + firstIdx + "|" + idx);
                gameCanvas.setMyTurn(false);
            } else {
                // Cancel or invalid — re-select
                player.selectStandardCard(idx);
                gameCanvas.refresh();
            }
        } else {
            int val = clicked.getValue();
            if (val == 6 || val == 7) {
                network.sendMessage("PLAY_CARD|" + idx);
                gameCanvas.setMyTurn(false);
            } else if (player.canFormAnyPair(idx)) {
                player.selectStandardCard(idx);
                gameCanvas.refresh();
            }
            // No valid play from this card — do nothing
        }
    }

    public GameCanvas getGameCanvas() { return gameCanvas; }
    public void refresh()             { gameCanvas.repaint(); }
}