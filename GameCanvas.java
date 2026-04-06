import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.List;
import java.util.ArrayList;

//GameCanvas — main drawing surface.

public class GameCanvas extends JComponent {

    public static final int WIDTH  = 1024;
    public static final int HEIGHT = 768;

    // Card geometry constants 
    private static final int CARD_W   = 88;
    private static final int CARD_H   = 126;
    private static final int CARD_GAP = 12;

    // Game state
    private Player     player;
    private String     opponentName      = "Waiting for opponent...";
    private int        opponentHandSize  = 0;
    private List<Card> opponentHandMirror = new ArrayList<>();
    private String     gameLog           = "";
    private boolean    myTurn            = false;
    private int        hoveredCard       = -1;
    private boolean    gameOver          = false;
    private String     gameOverMsg       = "";

    // Special card targeting state
    private int     activeSpecialIndex = -1;
    private Card    activeSpecialCard  = null;
    private boolean choosingTarget     = false;
    private boolean choosingOperation  = false;
    private String  chosenTargetOwner  = "";
    private int     chosenTargetIndex  = -1;

    // Pass button position
    public static final int PASS_X = 20, PASS_Y = 710, PASS_W = 120, PASS_H = 34;

    // Operation button position
    private static final int BTN_W  = 110, BTN_H  = 34;
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
                hoveredCard = -1;
                repaint();
            }
        });
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
    }

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

    // Returns +1 if button1 clicked, -1 if button2 clicked, 0 if neither.
    public int getOperationButtonAt(int mx, int my) {
        if (!choosingOperation) return 0;
        if (mx >= BTN1_X && mx <= BTN1_X + BTN_W && my >= BTN_Y && my <= BTN_Y + BTN_H) return +1;
        if (mx >= BTN2_X && mx <= BTN2_X + BTN_W && my >= BTN_Y && my <= BTN_Y + BTN_H) return -1;
        return 0;
    }

    // State setters

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

    public void setMyTurn(boolean t) {
        this.myTurn = t;
        repaint();
    }

    public void appendLog(String msg) {
        gameLog = msg + "\n" + gameLog;
        if (gameLog.length() > 500) gameLog = gameLog.substring(0, 500);
        repaint();
    }

    public void showGameOver(String msg) {
        gameOver    = true;
        gameOverMsg = msg;
        repaint();
    }

    // Special targeting state

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

    public boolean isMyTurn()              { return myTurn; }
    public boolean isChoosingTarget()      { return choosingTarget; }
    public boolean isChoosingOp()          { return choosingOperation; }
    public int     getActiveSpecialIndex() { return activeSpecialIndex; }
    public Card    getActiveSpecialCard()  { return activeSpecialCard; }
    public String  getChosenTargetOwner()  { return chosenTargetOwner; }
    public int     getChosenTargetIndex()  { return chosenTargetIndex; }
}