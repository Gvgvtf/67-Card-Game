import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.List;
import java.util.ArrayList;

/**
 * GameCanvas — renders the card game table.
 * No HP bars. Win condition displayed as a positional goal:
 *   left slot = 6, right slot = 7.
 *
 * Special card targeting is a two-step UI:
 *   Step 1: player clicks a special card → it becomes "active special".
 *   Step 2: player clicks a target card (own or opponent row) +
 *           chooses operation via on-screen buttons.
 */
public class GameCanvas extends JComponent {

    public static final int WIDTH  = 1024;
    public static final int HEIGHT = 768;

    // ── Colours ───────────────────────────────────────────────────────────────
    private static final Color BG          = new Color(20, 80, 40);
    private static final Color CARD_STD    = new Color(255, 248, 220);
    private static final Color CARD_SPL    = new Color(200, 160, 255);
    private static final Color CARD_HOVER  = new Color(255, 220, 80);
    private static final Color CARD_PEND   = new Color(255, 160, 40);
    private static final Color CARD_VALID  = new Color(140, 255, 140);
    private static final Color CARD_TARGET = new Color(255, 80,  80);
    private static final Color CARD_OUTLINE= new Color(80,  40,  10);
    private static final Color WIN_SLOT_6  = new Color(80, 160, 255);
    private static final Color WIN_SLOT_7  = new Color(255, 180, 60);
    private static final Color LOG_BG      = new Color(0, 0, 0, 160);
    private static final Color TEXT_WHITE  = Color.WHITE;

    private static final int CARD_W   = 88;
    private static final int CARD_H   = 126;
    private static final int CARD_GAP = 12;

    // ── Game state ────────────────────────────────────────────────────────────
    private Player  player;
    private String  opponentName      = "Waiting...";
    private int     opponentHandSize  = 0;
    private List<Card> opponentHandMirror = new ArrayList<>(); // face-up for targeting
    private String  gameLog           = "";
    private boolean myTurn            = false;
    private int     hoveredCard       = -1;
    private boolean gameOver          = false;
    private String  gameOverMsg       = "";

    // ── Special card targeting state ──────────────────────────────────────────
    private int     activeSpecialIndex = -1;  // index in player's hand of the chosen special
    private Card    activeSpecialCard  = null;
    private boolean choosingTarget     = false;
    // Once a target is chosen, show operation buttons
    private boolean choosingOperation  = false;
    private String  chosenTargetOwner  = "";
    private int     chosenTargetIndex  = -1;

    // Pass button
    public static final int PASS_X = 20,  PASS_Y = 710, PASS_W = 120, PASS_H = 34;

    // Operation buttons (shown during choosingOperation phase)
    // For VALUE_SHIFT: "+1" and "-1"
    // For MOVE_CARD:   "← Left" and "Right →"
    private static final int BTN_W = 110, BTN_H = 34;
    private static final int BTN1_X = WIDTH / 2 - BTN_W - 10;
    private static final int BTN2_X = WIDTH / 2 + 10;
    private static final int BTN_Y  = HEIGHT / 2 - BTN_H / 2;

    public GameCanvas(Player player) {
        this.player = player;
        setPreferredSize(new Dimension(WIDTH, HEIGHT));
        setMinimumSize(new Dimension(WIDTH, HEIGHT));
        setMaximumSize(new Dimension(WIDTH, HEIGHT));
        setFocusable(true);
        addMouseMotionListener(new MouseAdapter() {
            @Override public void mouseMoved(MouseEvent e) {
                int prev = hoveredCard;
                hoveredCard = getCardIndexAt(e.getX(), e.getY());
                if (hoveredCard != prev) repaint();
            }
            @Override public void mouseExited(MouseEvent e) {
                hoveredCard = -1; repaint();
            }
        });
    }

    // ── Hit testing ───────────────────────────────────────────────────────────

    public int getCardIndexAt(int mx, int my) {
        return cardIndexInRow(mx, my, player.getHand(), HEIGHT - CARD_H - 30);
    }

    public int getOpponentCardIndexAt(int mx, int my) {
        return cardIndexInRow(mx, my, opponentHandMirror, 70);
    }

    private int cardIndexInRow(int mx, int my, List<Card> hand, int rowY) {
        if (hand.isEmpty()) return -1;
        int totalW = hand.size() * CARD_W + (hand.size() - 1) * CARD_GAP;
        int startX = (WIDTH - totalW) / 2;
        for (int i = 0; i < hand.size(); i++) {
            int cx = startX + i * (CARD_W + CARD_GAP);
            if (mx >= cx && mx <= cx + CARD_W && my >= rowY && my <= rowY + CARD_H) return i;
        }
        return -1;
    }

    public boolean isPassButtonAt(int mx, int my) {
        return mx >= PASS_X && mx <= PASS_X + PASS_W
            && my >= PASS_Y && my <= PASS_Y + PASS_H;
    }

    /** Returns +1 if button1 clicked, -1 if button2 clicked, 0 if neither. */
    public int getOperationButtonAt(int mx, int my) {
        if (!choosingOperation) return 0;
        if (mx >= BTN1_X && mx <= BTN1_X + BTN_W && my >= BTN_Y && my <= BTN_Y + BTN_H) return +1;
        if (mx >= BTN2_X && mx <= BTN2_X + BTN_W && my >= BTN_Y && my <= BTN_Y + BTN_H) return -1;
        return 0;
    }

    // ── Paint ─────────────────────────────────────────────────────────────────

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,   RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        drawBackground(g2);
        drawWinGoalReminder(g2);
        drawOpponentArea(g2);
        drawPlayerArea(g2);
        drawGameLog(g2);
        drawTurnBanner(g2);
        drawPrompt(g2);

        if (choosingOperation) drawOperationButtons(g2);
        if (gameOver)          drawGameOverOverlay(g2);
    }

    private void drawBackground(Graphics2D g) {
        g.setColor(BG);
        g.fillRect(0, 0, WIDTH, HEIGHT);
        g.setColor(new Color(255, 255, 255, 12));
        for (int y = 0; y < HEIGHT; y += 40) g.drawLine(0, y, WIDTH, y);
        for (int x = 0; x < WIDTH;  x += 40) g.drawLine(x, 0, x, HEIGHT);
        // Centre divider
        g.setColor(new Color(255, 255, 255, 50));
        float[] dash = {10f, 10f};
        g.setStroke(new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND, 0, dash, 0));
        g.drawLine(0, HEIGHT / 2, WIDTH, HEIGHT / 2);
        g.setStroke(new BasicStroke(1));
    }

    /** Small reminder in the top-right corner showing the win arrangement. */
    private void drawWinGoalReminder(Graphics2D g) {
        int rx = WIDTH - 180, ry = 10;
        g.setFont(new Font("Georgia", Font.BOLD, 11));
        g.setColor(new Color(255, 255, 255, 160));
        g.drawString("Win: left=", rx, ry + 14);

        g.setColor(WIN_SLOT_6);
        g.fillRoundRect(rx + 62, ry, 28, 20, 6, 6);
        g.setColor(Color.WHITE);
        g.setFont(new Font("Georgia", Font.BOLD, 13));
        g.drawString("6", rx + 70, ry + 15);

        g.setColor(new Color(255, 255, 255, 160));
        g.setFont(new Font("Georgia", Font.BOLD, 11));
        g.drawString("  right=", rx + 90, ry + 14);

        g.setColor(WIN_SLOT_7);
        g.fillRoundRect(rx + 148, ry, 28, 20, 6, 6);
        g.setColor(Color.BLACK);
        g.setFont(new Font("Georgia", Font.BOLD, 13));
        g.drawString("7", rx + 156, ry + 15);
    }

    private void drawOpponentArea(Graphics2D g) {
        g.setFont(new Font("Georgia", Font.BOLD, 18));
        g.setColor(TEXT_WHITE);
        g.drawString(opponentName + "  (" + opponentHandSize + " cards)", 20, 38);

        if (opponentHandMirror.isEmpty()) {
            // Draw face-down placeholders
            int startX = (WIDTH - opponentHandSize * (CARD_W + CARD_GAP)) / 2;
            for (int i = 0; i < opponentHandSize; i++) {
                drawFaceDownCard(g, startX + i * (CARD_W + CARD_GAP), 50);
            }
        } else {
            // Draw face-up (for targeting during special card play)
            int totalW = opponentHandMirror.size() * CARD_W
                       + (opponentHandMirror.size() - 1) * CARD_GAP;
            int startX = (WIDTH - totalW) / 2;
            for (int i = 0; i < opponentHandMirror.size(); i++) {
                int cx  = startX + i * (CARD_W + CARD_GAP);
                boolean isTarget = choosingTarget
                    && chosenTargetOwner.equals(GameAction.TARGET_OPPONENT)
                    && i == chosenTargetIndex;
                drawCard(g, opponentHandMirror.get(i), cx, 50,
                    false, false, false, false, isTarget);
            }
        }
    }

    private void drawPlayerArea(Graphics2D g) {
        g.setFont(new Font("Georgia", Font.BOLD, 18));
        g.setColor(TEXT_WHITE);
        g.drawString(player.getName() + " (You)  (" + player.getHand().size() + " cards)",
            20, HEIGHT - CARD_H - 55);

        List<Card>    hand        = player.getHand();
        List<Integer> validSeconds = player.hasPending()
            ? player.validSecondCards() : new ArrayList<>();

        if (hand.isEmpty()) return;

        int totalW = hand.size() * CARD_W + (hand.size() - 1) * CARD_GAP;
        int startX = (WIDTH - totalW) / 2;
        int rowY   = HEIGHT - CARD_H - 30;

        for (int i = 0; i < hand.size(); i++) {
            int     cx          = startX + i * (CARD_W + CARD_GAP);
            boolean hovered     = (i == hoveredCard && myTurn);
            boolean pending     = (i == player.getPendingIndex());
            boolean validSecond = validSeconds.contains(i);
            boolean dimmed      = player.hasPending() && !pending && !validSecond;
            boolean isTarget    = choosingTarget
                && chosenTargetOwner.equals(GameAction.TARGET_SELF)
                && i == chosenTargetIndex;
            boolean isActive    = (i == activeSpecialIndex);
            int cy = (hovered || pending || isActive) ? rowY - 20 : rowY;

            drawCard(g, hand.get(i), cx, cy,
                hovered, pending || isActive, validSecond, dimmed, isTarget);
        }

        // Pass button
        if (myTurn && !choosingOperation) drawPassButton(g);

        // Position labels under the hand
        drawPositionLabels(g, hand.size(), startX, rowY + CARD_H + 4);
    }

    /** Draws "← Left / Right →" position labels under the player's hand. */
    private void drawPositionLabels(Graphics2D g, int handSize, int startX, int y) {
        if (handSize == 0) return;
        g.setFont(new Font("SansSerif", Font.PLAIN, 11));

        // Left label under first card
        g.setColor(WIN_SLOT_6);
        g.drawString("← Left (6)", startX, y + 12);

        // Right label under last card
        int lastX = startX + (handSize - 1) * (CARD_W + CARD_GAP);
        g.setColor(WIN_SLOT_7);
        FontMetrics fm = g.getFontMetrics();
        String rightLabel = "Right (7) →";
        g.drawString(rightLabel, lastX + CARD_W - fm.stringWidth(rightLabel), y + 12);
    }

    private void drawPassButton(Graphics2D g) {
        g.setColor(new Color(140, 70, 20));
        g.fillRoundRect(PASS_X, PASS_Y, PASS_W, PASS_H, 8, 8);
        g.setColor(Color.WHITE);
        g.setStroke(new BasicStroke(1.5f));
        g.drawRoundRect(PASS_X, PASS_Y, PASS_W, PASS_H, 8, 8);
        g.setFont(new Font("Georgia", Font.BOLD, 13));
        FontMetrics fm = g.getFontMetrics();
        String lbl = "Pass & Draw";
        g.drawString(lbl, PASS_X + (PASS_W - fm.stringWidth(lbl)) / 2,
            PASS_Y + PASS_H / 2 + fm.getAscent() / 2 - 2);
    }

    /** Shown when player must pick +1/-1 or ←/→ after choosing a target. */
    private void drawOperationButtons(Graphics2D g) {
        // Dim the rest of the screen slightly
        g.setColor(new Color(0, 0, 0, 100));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        boolean isValueShift = activeSpecialCard != null
            && activeSpecialCard.getType() == Card.CardType.VALUE_SHIFT;

        String lbl1 = isValueShift ? "+1" : "← Left";
        String lbl2 = isValueShift ? "-1"  : "Right →";

        drawButton(g, BTN1_X, BTN_Y, BTN_W, BTN_H, lbl1, new Color(60, 160, 60));
        drawButton(g, BTN2_X, BTN_Y, BTN_W, BTN_H, lbl2, new Color(160, 60, 60));

        g.setFont(new Font("Georgia", Font.ITALIC, 13));
        g.setColor(Color.WHITE);
        String prompt = isValueShift ? "Choose: add or subtract 1 from the target card?"
                                     : "Choose: move the target card left or right?";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(prompt, (WIDTH - fm.stringWidth(prompt)) / 2, BTN_Y - 14);
    }

    private void drawButton(Graphics2D g, int x, int y, int w, int h, String label, Color bg) {
        g.setColor(bg);
        g.fillRoundRect(x, y, w, h, 10, 10);
        g.setColor(Color.WHITE);
        g.setStroke(new BasicStroke(2));
        g.drawRoundRect(x, y, w, h, 10, 10);
        g.setFont(new Font("Georgia", Font.BOLD, 16));
        FontMetrics fm = g.getFontMetrics();
        g.drawString(label, x + (w - fm.stringWidth(label)) / 2,
            y + h / 2 + fm.getAscent() / 2 - 2);
        g.setStroke(new BasicStroke(1));
    }

    private void drawGameLog(Graphics2D g) {
        int lx = WIDTH - 280, ly = HEIGHT / 2 - 110, lw = 270, lh = 210;
        g.setColor(LOG_BG);
        g.fillRoundRect(lx, ly, lw, lh, 10, 10);
        g.setColor(new Color(255, 255, 255, 60));
        g.drawRoundRect(lx, ly, lw, lh, 10, 10);
        g.setFont(new Font("Monospaced", Font.PLAIN, 11));
        g.setColor(TEXT_WHITE);
        drawWrappedString(g, gameLog, lx + 8, ly + 16, lw - 16, 14);
    }

    private void drawTurnBanner(Graphics2D g) {
        String lbl   = myTurn ? "YOUR TURN" : opponentName + "'S TURN";
        Color  color = myTurn ? new Color(80, 220, 80) : new Color(220, 80, 80);
        g.setFont(new Font("Georgia", Font.BOLD, 18));
        g.setColor(color);
        FontMetrics fm = g.getFontMetrics();
        g.drawString(lbl, (WIDTH - fm.stringWidth(lbl)) / 2, HEIGHT / 2 - 12);
    }

    private void drawPrompt(Graphics2D g) {
        if (choosingOperation) return; // operation buttons take over
        String prompt;
        Color  color;
        if (!myTurn) {
            prompt = "Waiting for " + opponentName + "...";
            color  = new Color(200, 200, 200, 160);
        } else if (choosingTarget) {
            prompt = "Click any card (yours or opponent's) to target it";
            color  = new Color(255, 120, 80);
        } else if (player.hasPending()) {
            prompt = "Select a second card to pair with "
                + player.getPendingCard().getName() + " — or click it again to cancel";
            color  = new Color(255, 200, 80);
        } else {
            prompt = "Play a card, combine two cards, use a special, or Pass";
            color  = new Color(255, 230, 80);
        }
        g.setFont(new Font("Georgia", Font.ITALIC, 13));
        g.setColor(color);
        FontMetrics fm = g.getFontMetrics();
        g.drawString(prompt, (WIDTH - fm.stringWidth(prompt)) / 2, HEIGHT - 8);
    }

    private void drawGameOverOverlay(Graphics2D g) {
        g.setColor(new Color(0, 0, 0, 190));
        g.fillRect(0, 0, WIDTH, HEIGHT);
        g.setFont(new Font("Georgia", Font.BOLD, 52));
        g.setColor(new Color(255, 210, 50));
        FontMetrics fm = g.getFontMetrics();
        g.drawString(gameOverMsg, (WIDTH - fm.stringWidth(gameOverMsg)) / 2, HEIGHT / 2);
        g.setFont(new Font("Georgia", Font.PLAIN, 20));
        g.setColor(Color.WHITE);
        String sub = "Close the window to exit.";
        fm = g.getFontMetrics();
        g.drawString(sub, (WIDTH - fm.stringWidth(sub)) / 2, HEIGHT / 2 + 55);
    }

    // ── Card drawing ──────────────────────────────────────────────────────────

    private void drawCard(Graphics2D g, Card card, int x, int y,
                          boolean hovered, boolean lifted, boolean validSecond,
                          boolean dimmed, boolean targeted) {
        if (dimmed) g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.35f));

        Color bg = card.isSpecial() ? CARD_SPL : CARD_STD;
        if (targeted)    bg = CARD_TARGET;
        else if (lifted) bg = CARD_PEND;
        else if (validSecond) bg = CARD_VALID;
        else if (hovered)     bg = CARD_HOVER;

        // Colour the winning-position cards distinctly
        if (!card.isSpecial()) {
            if (card.getValue() == 6) bg = mixColor(bg, WIN_SLOT_6, 0.35f);
            if (card.getValue() == 7) bg = mixColor(bg, WIN_SLOT_7, 0.35f);
        }

        g.setColor(new Color(0, 0, 0, 70));
        g.fillRoundRect(x + 4, y + 4, CARD_W, CARD_H, 12, 12);

        g.setColor(bg);
        g.fillRoundRect(x, y, CARD_W, CARD_H, 12, 12);

        Color border = targeted    ? Color.RED
                     : lifted      ? Color.ORANGE
                     : validSecond ? new Color(0, 180, 0)
                     : hovered     ? Color.YELLOW
                     : CARD_OUTLINE;
        g.setColor(border);
        float bw = (targeted || lifted || validSecond) ? 3f : 1.5f;
        g.setStroke(new BasicStroke(bw));
        g.drawRoundRect(x, y, CARD_W, CARD_H, 12, 12);
        g.setStroke(new BasicStroke(1));

        // Name top-left
        g.setFont(new Font("Georgia", Font.PLAIN, 10));
        g.setColor(Color.DARK_GRAY);
        g.drawString(card.getName(), x + 6, y + 14);

        // Centre value
        if (card.isSpecial()) {
            g.setFont(new Font("Georgia", Font.BOLD, 13));
            g.setColor(new Color(60, 0, 120));
            drawCentredString(g, card.getName(), x, y + 46, CARD_W, 13);
        } else {
            g.setFont(new Font("Georgia", Font.BOLD, 38));
            g.setColor(new Color(30, 30, 30));
            FontMetrics fm = g.getFontMetrics();
            String v = String.valueOf(card.getValue());
            g.drawString(v, x + (CARD_W - fm.stringWidth(v)) / 2,
                y + CARD_H / 2 + fm.getAscent() / 2 - 6);
        }

        // Description
        g.setFont(new Font("SansSerif", Font.PLAIN, 9));
        g.setColor(Color.DARK_GRAY);
        drawWrappedString(g, card.getDescription(), x + 5, y + CARD_H - 28, CARD_W - 10, 10);

        if (dimmed) g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
    }

    private void drawFaceDownCard(Graphics2D g, int x, int y) {
        g.setColor(new Color(40, 40, 120));
        g.fillRoundRect(x, y, CARD_W, CARD_H, 12, 12);
        g.setColor(new Color(80, 80, 180));
        g.setStroke(new BasicStroke(1.5f));
        g.drawRoundRect(x, y, CARD_W, CARD_H, 12, 12);
        g.setStroke(new BasicStroke(1));
        g.setColor(new Color(255, 255, 255, 25));
        for (int i = 0; i < CARD_H; i += 12) g.drawLine(x, y + i, x + CARD_W, y + i);
        for (int i = 0; i < CARD_W; i += 12) g.drawLine(x + i, y, x + i, y + CARD_H);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Color mixColor(Color a, Color b, float t) {
        return new Color(
            (int)(a.getRed()   + t * (b.getRed()   - a.getRed())),
            (int)(a.getGreen() + t * (b.getGreen() - a.getGreen())),
            (int)(a.getBlue()  + t * (b.getBlue()  - a.getBlue()))
        );
    }

    private void drawCentredString(Graphics2D g, String text, int x, int y, int w, int size) {
        g.setFont(new Font("Georgia", Font.BOLD, size));
        FontMetrics fm = g.getFontMetrics();
        g.drawString(text, x + (w - fm.stringWidth(text)) / 2, y);
    }

    private void drawWrappedString(Graphics2D g, String text, int x, int y, int maxW, int lineH) {
        if (text == null || text.isEmpty()) return;
        FontMetrics fm    = g.getFontMetrics();
        String[]    words = text.split(" ");
        StringBuilder line = new StringBuilder();
        int curY = y;
        for (String word : words) {
            String test = line.length() == 0 ? word : line + " " + word;
            if (fm.stringWidth(test) > maxW) {
                g.drawString(line.toString(), x, curY);
                curY += lineH;
                line = new StringBuilder(word);
            } else {
                if (line.length() > 0) line.append(" ");
                line.append(word);
            }
        }
        if (line.length() > 0) g.drawString(line.toString(), x, curY);
    }

    // ── State setters (called by NetworkClient on server updates) ─────────────

    public void setOpponentInfo(String name, int handSize) {
        this.opponentName     = name;
        this.opponentHandSize = handSize;
        repaint();
    }

    public void setOpponentHandMirror(List<Card> cards) {
        this.opponentHandMirror = new ArrayList<>(cards);
        repaint();
    }

    public void clearOpponentMirror() {
        this.opponentHandMirror.clear();
        repaint();
    }

    public void setMyTurn(boolean t)     { this.myTurn = t; repaint(); }

    public void appendLog(String msg) {
        gameLog = msg + "\n" + gameLog;
        if (gameLog.length() > 500) gameLog = gameLog.substring(0, 500);
        repaint();
    }

    public void showGameOver(String msg) { gameOver = true; gameOverMsg = msg; repaint(); }

    // ── Special targeting state ───────────────────────────────────────────────

    public void startSpecialTargeting(int specialIndex, Card specialCard) {
        this.activeSpecialIndex = specialIndex;
        this.activeSpecialCard  = specialCard;
        this.choosingTarget     = true;
        this.choosingOperation  = false;
        this.chosenTargetOwner  = "";
        this.chosenTargetIndex  = -1;
        repaint();
    }

    public void confirmTarget(String owner, int index) {
        this.chosenTargetOwner = owner;
        this.chosenTargetIndex = index;
        this.choosingTarget    = false;
        this.choosingOperation = true;
        repaint();
    }

    public void cancelSpecial() {
        activeSpecialIndex = -1;
        activeSpecialCard  = null;
        choosingTarget     = false;
        choosingOperation  = false;
        chosenTargetOwner  = "";
        chosenTargetIndex  = -1;
        repaint();
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public boolean isMyTurn()          { return myTurn; }
    public boolean isChoosingTarget()  { return choosingTarget; }
    public boolean isChoosingOp()      { return choosingOperation; }
    public int     getActiveSpecialIndex() { return activeSpecialIndex; }
    public Card    getActiveSpecialCard()  { return activeSpecialCard; }
    public String  getChosenTargetOwner() { return chosenTargetOwner; }
    public int     getChosenTargetIndex() { return chosenTargetIndex; }
}