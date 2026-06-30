import java.util.UUID;

public class TestUUID {
    public static void main(String[] args) {
        try {
            UUID test = UUID.fromString("880bd384-660e-40f8-86f0-5466950c00c");
            System.out.println("Parsed UUID: " + test.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
