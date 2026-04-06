import javax.swing.*;

// GameStarter — entry point for the player's client.

public class GameStarter {

    public static void main(String[] args) {
        String playerName = JOptionPane.showInputDialog(
            null, "Enter your name:", "Card Battle — Join Game", JOptionPane.PLAIN_MESSAGE);

        if (playerName == null || playerName.trim().isEmpty()) {
            JOptionPane.showMessageDialog(null, "No name entered. Exiting.");
            return;
        }

        final String name = playerName.trim();

        // Start the game client on the Swing event thread.
        SwingUtilities.invokeLater(() -> {
            Player        player  = new Player(name);
            NetworkClient network = new NetworkClient();

            if (!network.connect(name)) {
                JOptionPane.showMessageDialog(null,
                    "Could not connect to the game server.\n"
                    + "Make sure GameServer is running on localhost:5000.",
                    "Connection Failed", JOptionPane.ERROR_MESSAGE);
                return;
            }

            GameFrame gameFrame = new GameFrame(player, network);
            network.startListening(gameFrame, player);
            System.out.println("Connected as: " + name);
        });
    }
}