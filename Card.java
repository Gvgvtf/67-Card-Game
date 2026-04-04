/**
 * Card — represents a single card in the game.
 *
 * STANDARD cards are numbered 1–10.
 * Special cards:
 *   VALUE_SHIFT — adds or subtracts 1 from any card in either player's hand.
 *   MOVE_CARD   — moves any card in either player's hand one position left or right.
 */
public class Card {

    public enum CardType {
        STANDARD,     // numbered 1–10
        VALUE_SHIFT,  // +1 or -1 to a chosen card's value
        MOVE_CARD     // shift a chosen card one position left or right
    }

    private String   name;
    private CardType type;
    private int      value;
    private String   description;
    private int      id;

    private static int nextId = 1;

    // ── Constructors ──────────────────────────────────────────────────────────

    /** Standard numbered card (1–10). */
    public Card(int value) {
        this.id          = nextId++;
        this.type        = CardType.STANDARD;
        this.value       = value;
        this.name        = String.valueOf(value);
        if (value == 6 || value == 7) {
            this.description = "Play alone in winning position, or combine with another card.";
        } else {
            this.description = "Pair with another card so they combine to 6 or 7.";
        }
    }

    /** Special card. */
    public Card(CardType type) {
        this.id   = nextId++;
        this.type = type;
        switch (type) {
            case VALUE_SHIFT:
                name        = "+1 / -1";
                value       = 0;
                description = "Add or subtract 1 from any card in either hand.";
                break;
            case MOVE_CARD:
                name        = "Move";
                value       = 0;
                description = "Shift any card in either hand one position left or right.";
                break;
            default:
                name        = "Unknown";
                value       = 0;
                description = "???";
        }
    }

    // ── Serialisation ─────────────────────────────────────────────────────────

    /** Format: TYPE:name:value:id */
    public String serialize() {
        return type.name() + ":" + name + ":" + value + ":" + id;
    }

    public static Card deserialize(String data) {
        String[] parts = data.split(":");
        CardType type  = CardType.valueOf(parts[0]);
        int      value = Integer.parseInt(parts[2]);
        int      id    = Integer.parseInt(parts[3]);
        Card card = (type == CardType.STANDARD) ? new Card(value) : new Card(type);
        card.id = id;
        return card;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public String   getName()        { return name; }
    public CardType getType()        { return type; }
    public int      getValue()       { return value; }
    public String   getDescription() { return description; }
    public int      getId()          { return id; }
    public boolean  isSpecial()      { return type != CardType.STANDARD; }

    /** Used by VALUE_SHIFT to mutate the card's numeric value. */
    public void setValue(int value) {
        this.value = value;
        this.name  = String.valueOf(value);
        if (value == 6 || value == 7) {
            this.description = "Play alone in winning position, or combine with another card.";
        } else {
            this.description = "Pair with another card so they combine to 6 or 7.";
        }
    }

    @Override
    public String toString() {
        return "[" + name + " | " + description + "]";
    }
}