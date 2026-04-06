import java.util.ArrayList;
import java.util.List;

/**
 * Player — manages the player's hand and card game logic.
 *
 * Win condition: exactly 2 cards in hand — a 6 at index 0 (left) and a 7 at index 1 (right).
 *
 * Turn flow:
 *   1. Draw 1 card from the deck.
 *   2. Play one action:
 *        a) Play a standard card or pair of standard cards that combine to 6 or 7
 *           → both/all go to discard, turn ends.
 *        b) Play a VALUE_SHIFT special card → choose a target card + operation (+1/-1).
 *        c) Play a MOVE_CARD special card   → choose a target card + direction (left/right).
 *        d) Pass → draw 1 extra card, turn ends.
 *   3. After the action, check win condition.
 */
public class Player {

    public static final int INITIAL_HAND = 7;

    private String     name;
    private List<Card> hand;
    private Deck       deck;
    private Card       lastPlayedCard;

    // Two-step standard card selection state.
    private Card pendingCard;
    private int  pendingIndex;

    public Player(String name) {
        this.name         = name;
        this.hand         = new ArrayList<>();
        this.deck         = new Deck();
        this.pendingCard  = null;
        this.pendingIndex = -1;
    }

    // Turn Management

    /**
     * Called at the start of the player's turn.
     * Draws 1 card from the deck and resets pending state.
     */

    public String startTurn() {
        clearPending();
        Card drawn = deck.draw();
        if (drawn != null) {
            hand.add(drawn);
            return name + "'s turn — drew 1 card (" + drawn.getName()
                + "). Hand size: " + hand.size();
        }
        return name + "'s turn — deck is empty, no card drawn.";
    }

    /**
     * Deals the initial hand at the start of the game.
     */
    public void dealInitialHand() {
        List<Card> drawn = deck.drawMultiple(INITIAL_HAND);
        hand.addAll(drawn);
    }

    /**
     * Step 1: player selects a standard card.
     * Returns a committed GameAction if the card is a solo 6 or 7.
     * Returns null and sets pendingCard if the card can form a valid pair.
     * Returns null and does nothing if the card has no valid play.
     */

    public GameAction selectStandardCard(int handIndex) {
        if (handIndex < 0 || handIndex >= hand.size()) return null;
        Card card = hand.get(handIndex);
        if (card.getType() != Card.CardType.STANDARD) return null;

        // Cancel pending if same card clicked again
        if (pendingIndex == handIndex) { clearPending(); return null; }

        // Solo 6 or 7.
        if (card.getValue() == 6 || card.getValue() == 7) {
            clearPending();
            return commitSingleStandard(handIndex);
        }

        // Can pair with something.
        if (canFormAnyPair(handIndex)) {
            pendingCard  = card;
            pendingIndex = handIndex;
            return null;
        }

        return null; // no valid play.
    }

    /**
     * Step 2: player selects the second card of a pair.
     * Commits both to discard if valid; clears pending if not.
     */

    public GameAction selectSecondCard(int handIndex) {
        if (pendingCard == null)                        return null;
        if (handIndex < 0 || handIndex >= hand.size()) return null;
        if (handIndex == pendingIndex)                 { clearPending(); return null; }

        Card second = hand.get(handIndex);
        if (second.getType() != Card.CardType.STANDARD) return null;

        int result = combinedResult(pendingCard.getValue(), second.getValue());
        if (result == -1) { clearPending(); return null; }

        return commitPair(pendingIndex, handIndex, result);
    }

    /**
     * Removes the special card at handIndex from hand and discards it.
     * The caller (GameServer / GameFrame) is responsible for applying
     * the actual effect to the correct target card.
     * Returns the special card that was played, or null if invalid.
     */

    public Card playSpecialCard(int handIndex) {
        if (handIndex < 0 || handIndex >= hand.size()) return null;
        Card card = hand.get(handIndex);
        if (!card.isSpecial()) return null;
        clearPending();
        hand.remove(handIndex);
        lastPlayedCard = card;
        deck.discard(card);
        return card;
    }

    // VALUE_SHIFT effect.

    /**
     * Applies +1 or -1 to the card at targetIndex in this player's hand.
     * delta must be +1 or -1.
     * Does nothing if the target is itself a special card.
     */

    public String applyValueShift(int targetIndex, int delta) {
        if (targetIndex < 0 || targetIndex >= hand.size()) return "Invalid target.";
        Card target = hand.get(targetIndex);
        if (target.isSpecial()) return "Cannot shift the value of a special card.";

        int oldVal = target.getValue();
        int newVal = oldVal + delta;
        target.setValue(newVal);

        return name + "'s card at position " + (targetIndex + 1)
            + " changed from " + oldVal + " to " + newVal + ".";
    }

    // MOVE_CARD effect.

    /**
     * Moves the card at targetIndex one position in the given direction.
     * direction: -1 = left, +1 = right.
     * Movement is blocked if the card is already at the corresponding edge.
     * Returns a log message.
     */

    public String applyMoveCard(int targetIndex, int direction) {
        if (targetIndex < 0 || targetIndex >= hand.size()) return "Invalid target.";

        int newIndex = targetIndex + direction;

        if (newIndex < 0 || newIndex >= hand.size()) {
            return "Cannot move — card is already at the "
                + (direction == -1 ? "leftmost" : "rightmost") + " position.";
        }

        Card card = hand.remove(targetIndex);
        hand.add(newIndex, card);

        return name + "'s card " + card.getName() + " moved "
            + (direction == -1 ? "left" : "right")
            + " to position " + (newIndex + 1) + ".";
    }

    /**
     * Returns the valid directions a card at targetIndex can be moved.
     * -1 (left) is valid if targetIndex > 0.
     * +1 (right) is valid if targetIndex < hand.size() - 1.
     */

    public List<Integer> validMoveDirections(int targetIndex) {
        List<Integer> dirs = new ArrayList<>();
        if (targetIndex > 0)               dirs.add(-1);
        if (targetIndex < hand.size() - 1) dirs.add(+1);
        return dirs;
    }

    // Pass Turn

    /**
     * Player passes — draws 1 extra card as compensation.
     */
    public GameAction passTurn() {
        clearPending();
        Card drawn = deck.draw();
        if (drawn != null) hand.add(drawn);
        Card passCard = new Card(Card.CardType.VALUE_SHIFT); // placeholder carrier
        GameAction action = new GameAction(passCard, name);
        action.setPass(true);
        action.setMessage(name + " passes and draws a card. Hand size: " + hand.size());
        return action;
    }

    // Win Condition

    /**
     * Win condition: hand has exactly 2 cards,
     * index 0 (left) is a standard 6,
     * index 1 (right) is a standard 7.
     */

    public boolean hasWon() {
        if (hand.size() != 2) return false;
        Card left  = hand.get(0);
        Card right = hand.get(1);
        return left.getType()  == Card.CardType.STANDARD && left.getValue()  == 6
            && right.getType() == Card.CardType.STANDARD && right.getValue() == 7;
    }

    // Returns 6 or 7 if any operation on a and b hits that target, else -1.
    public static int combinedResult(int a, int b) {
        if (a + b == 6 || a + b == 7)                      return a + b;
        if (Math.abs(a - b) == 6 || Math.abs(a - b) == 7)  return Math.abs(a - b);
        if (a * b == 6 || a * b == 7)                       return a * b;
        return -1;
    }

    // Checks if the card at handIndex can form a valid pair with any other card in hand.
    public boolean canFormAnyPair(int handIndex) {
        Card card = hand.get(handIndex);
        for (int i = 0; i < hand.size(); i++) {
            if (i == handIndex) continue;
            Card other = hand.get(i);
            if (other.getType() != Card.CardType.STANDARD) continue;
            if (combinedResult(card.getValue(), other.getValue()) != -1) return true;
        }
        return false;
    }

    // Checks which cards in hand can form a valid pair with the pending card.
    public List<Integer> validSecondCards() {
        List<Integer> valid = new ArrayList<>();
        if (pendingCard == null) return valid;
        for (int i = 0; i < hand.size(); i++) {
            if (i == pendingIndex) continue;
            Card other = hand.get(i);
            if (other.getType() != Card.CardType.STANDARD) continue;
            if (combinedResult(pendingCard.getValue(), other.getValue()) != -1) valid.add(i);
        }
        return valid;
    }

    // Checks if the player has any valid play with the current hand.
    public boolean hasAnyValidPlay() {
        for (int i = 0; i < hand.size(); i++) {
            Card c = hand.get(i);
            if (c.isSpecial()) return true;
            if (c.getValue() == 6 || c.getValue() == 7) return true;
            if (canFormAnyPair(i)) return true;
        }
        return false;
    }

    // Commits the play of a single standard card (6 or 7) and returns the corresponding GameAction.
    private GameAction commitSingleStandard(int handIndex) {
        Card card = hand.remove(handIndex);
        lastPlayedCard = card;
        deck.discard(card);
        GameAction action = new GameAction(card, name);
        action.setMessage(name + " plays " + card.getName()
            + " alone — discarded. Turn ends.");
        return action;
    }

    // Commits the play of a pair of standard cards and returns the corresponding GameAction.
    private GameAction commitPair(int firstIndex, int secondIndex, int result) {
        int hi = Math.max(firstIndex, secondIndex);
        int lo = Math.min(firstIndex, secondIndex);
        Card hiCard = hand.remove(hi);
        Card loCard = hand.remove(lo);
        lastPlayedCard = loCard;
        deck.discard(hiCard);
        deck.discard(loCard);
        clearPending();

        String op = operationUsed(loCard.getValue(), hiCard.getValue(), result);
        GameAction action = new GameAction(loCard, name);
        action.setMessage(name + " plays " + loCard.getName()
            + " " + op + " " + hiCard.getName() + " = " + result
            + " — both discarded. Turn ends.");
        return action;
    }

    private String operationUsed(int a, int b, int result) {
        if (a + b == result)            return "+";
        if (Math.abs(a - b) == result)  return "−";
        if (a * b == result)            return "×";
        return "?";
    }

    private void clearPending() {
        pendingCard  = null;
        pendingIndex = -1;
    }

    // Serializes the player's hand to a string format for network transmission.
    public String serializeHand() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < hand.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(hand.get(i).serialize());
        }
        return sb.toString();
    }

    public boolean    hasPending()       { return pendingCard != null; }
    public Card       getPendingCard()   { return pendingCard; }
    public int        getPendingIndex()  { return pendingIndex; }
    public boolean    hasCards()         { return !hand.isEmpty(); }

    public String     getName()          { return name; }
    public List<Card> getHand()          { return hand; }
    public Card       getLastPlayed()    { return lastPlayedCard; }
    public int        getDeckRemaining() { return deck.remaining(); }
}