/**
 * GameAction — carries the result of any played card over the network.
 *
 * Standard play  : message only.
 * VALUE_SHIFT    : targetOwner, targetIndex, delta (+1 or -1).
 * MOVE_CARD      : targetOwner, targetIndex, direction (-1 left, +1 right).
 * Pass           : pass = true.
 */

public class GameAction {

    // Identifies the owner of the card that has been played: "self" or "opponent"
    public static final String TARGET_SELF     = "self";
    public static final String TARGET_OPPONENT = "opponent";

    private Card    card;
    private String  playerName;
    private String  message;
    private boolean pass;

    // Special card targeting
    private String  targetOwner;  // "self" or "opponent"
    private int     targetIndex;  // index in the target's hand
    private int     delta;        // VALUE_SHIFT: +1 or -1 / MOVE_CARD: -1 (left) or +1 (right)

    public GameAction(Card card, String playerName) {
        this.card        = card;
        this.playerName  = playerName;
        this.message     = "";
        this.pass        = false;
        this.targetOwner = "";
        this.targetIndex = -1;
        this.delta       = 0;
    }

    /**
    * Serialisation of GameAction to a string format.
    * Format: ACTION|<card>|<playerName>|<pass>|<targetOwner>|<targetIndex>|<delta>|<message>
    */

    public String serialize() {
        return "ACTION|"
            + card.serialize()                            + "|"
            + playerName                                  + "|"
            + pass                                        + "|"
            + (targetOwner.isEmpty() ? "-" : targetOwner) + "|"
            + targetIndex                                 + "|"
            + delta                                       + "|"
            + message.replace("|", "~");
    }

    // Deserialization of GameAction back to a Java object.
    public static GameAction deserialize(String data) {
        String[] p  = data.split("\\|", 8);
        Card     c  = Card.deserialize(p[1]);
        String   pn = p[2];
        boolean  ps = Boolean.parseBoolean(p[3]);
        String   to = p[4].equals("-") ? "" : p[4];
        int      ti = Integer.parseInt(p[5]);
        int      d  = Integer.parseInt(p[6]);
        String   msg = p[7].replace("~", "|");

        GameAction a = new GameAction(c, pn);
        a.setPass(ps);
        a.setTargetOwner(to);
        a.setTargetIndex(ti);
        a.setDelta(d);
        a.setMessage(msg);
        return a;
    }

    public Card    getCard()         { return card; }
    public String  getPlayerName()   { return playerName; }
    public String  getMessage()      { return message; }
    public boolean isPass()          { return pass; }
    public String  getTargetOwner()  { return targetOwner; }
    public int     getTargetIndex()  { return targetIndex; }
    public int     getDelta()        { return delta; }

    public void setMessage(String m)     { this.message     = m; }
    public void setPass(boolean p)       { this.pass        = p; }
    public void setTargetOwner(String o) { this.targetOwner = o; }
    public void setTargetIndex(int i)    { this.targetIndex = i; }
    public void setDelta(int d)          { this.delta       = d; }
}