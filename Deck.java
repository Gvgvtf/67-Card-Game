import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Deck — manages the draw pile and discard pile.
 *
 * Composition (36 cards total):
 *   Standard 1–10 (except 6 and 7) : 3 copies each = 24 cards
 *   Standard 6 and 7               : 1 copy each = 2 cards
 *   VALUE_SHIFT                    : 5 copies
 *   MOVE_CARD                      : 5 copies
 */

public class Deck {

    private List<Card> drawPile;
    private List<Card> discardPile;

    public Deck() {
        drawPile    = new ArrayList<>();
        discardPile = new ArrayList<>();
        buildDeck();
        shuffle();
    }

    private void buildDeck() {
        for (int v = 1; v <= 10; v++) {
            if (v != 6 && v != 7) {
                for (int c = 0; c < 3; c++) {
                    drawPile.add(new Card(v));
                }
            }
            else if (v == 6 || v == 7) {
                drawPile.add(new Card(v));
            }
        }
        for (int c = 0; c < 5; c++) {
            drawPile.add(new Card(Card.CardType.VALUE_SHIFT));
            drawPile.add(new Card(Card.CardType.MOVE_CARD));
        }
    }

    // Randomizes the order of cards in the draw pile.
    public void shuffle() {
        Collections.shuffle(drawPile);
    }

    /**
     * Draws the top card. If the draw pile is empty, the discard pile is
     * reshuffled back in (excluding any cards currently in players' hands).
     */

    public Card draw() {
        if (drawPile.isEmpty()) {
            if (discardPile.isEmpty()) return null;
            drawPile.addAll(discardPile);
            discardPile.clear();
            shuffle();
            System.out.println("[Deck] Reshuffled discard pile back into draw pile.");
        }
        return drawPile.remove(0);
    }

    /** 
     * Draws multiple cards at once. 
     * Used for initial dealing of cards at the start of the game for both players.
     */

    public List<Card> drawMultiple(int count) {
        List<Card> drawn = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Card c = draw();
            if (c != null) drawn.add(c);
        }
        return drawn;
    }

    // Moves a card to the discard pile.
    public void discard(Card card) {
        discardPile.add(card);
    }

    public int  remaining()     { return drawPile.size(); } // Checks for the cards left in draw pile.
    public int  discardCount()  { return discardPile.size(); } // Checks for the amount of cards in the discard pile.
    public boolean isEmpty()    { return drawPile.isEmpty() && discardPile.isEmpty(); } // Checks if both draw and discard piles are empty.
}