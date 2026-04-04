import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Deck — manages the draw pile and discard pile.
 *
 * Composition (40 cards total):
 *   Standard 1–10 : 3 copies each = 30 cards
 *   VALUE_SHIFT    : 5 copies
 *   MOVE_CARD      : 5 copies
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
        // Standard cards — 3 copies each
        for (int v = 1; v <= 10; v++) {
            for (int c = 0; c < 3; c++) {
                drawPile.add(new Card(v));
            }
        }
        // Special cards — 5 copies each
        for (int c = 0; c < 5; c++) {
            drawPile.add(new Card(Card.CardType.VALUE_SHIFT));
            drawPile.add(new Card(Card.CardType.MOVE_CARD));
        }
    }

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

    public List<Card> drawMultiple(int count) {
        List<Card> drawn = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Card c = draw();
            if (c != null) drawn.add(c);
        }
        return drawn;
    }

    /** Moves a card to the discard pile. */
    public void discard(Card card) {
        discardPile.add(card);
    }

    public int  remaining()     { return drawPile.size(); }
    public int  discardCount()  { return discardPile.size(); }
    public boolean isEmpty()    { return drawPile.isEmpty() && discardPile.isEmpty(); }
}