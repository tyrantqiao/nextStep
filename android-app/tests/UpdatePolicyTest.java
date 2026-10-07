package com.nextstep.training;

public final class UpdatePolicyTest {
    private static int checks;
    private static void check(boolean condition) { checks++; if(!condition) throw new AssertionError("Check " + checks + " failed"); }
    private static void rejected(Runnable action) { checks++; try { action.run(); } catch(IllegalArgumentException expected) { return; } throw new AssertionError("Expected rejection"); }
    public static void main(String[] args) throws Exception {
        long interval = 12L * 60 * 60 * 1000;
        check(UpdatePolicy.checkDue(true, interval, interval));
        check(!UpdatePolicy.checkDue(false, interval, interval));
        check(!UpdatePolicy.checkDue(false, interval, 1));
        check(UpdatePolicy.checkDue(false, interval, 0));
        check(UpdatePolicy.checkDue(false, 1, interval));
        check(UpdatePolicy.DEFAULT_SOURCE.equals("https://github.com/tyrantqiao/nextStep/releases/latest/download/update.json"));
        check(UpdatePolicy.newer(14,15)); check(!UpdatePolicy.newer(14,14)); check(!UpdatePolicy.newer(14,13));
        check(UpdatePolicy.hex(new byte[]{0,15,(byte)255}).equals("000fff"));
        for(String url : new String[]{"http://example.com/update.json", "file:///update.apk", "https://user:password@example.com/a", "https://example.com/a#part", "not a url"}) rejected(() -> UpdatePolicy.https(url));
        check(UpdatePolicy.https("https://example.com/update.json").getHost().equals("example.com"));
        String hash = new String(new char[64]).replace('\0','a');
        UpdatePolicy.metadata(15,"0.6.1",26,100,hash,"https://example.com/app.apk"); checks++;
        rejected(() -> UpdatePolicy.metadata(0,"0.6.1",26,100,hash,"https://example.com/app.apk"));
        rejected(() -> UpdatePolicy.metadata(15,"",26,100,hash,"https://example.com/app.apk"));
        rejected(() -> UpdatePolicy.metadata(15,"0.6.1",25,100,hash,"https://example.com/app.apk"));
        rejected(() -> UpdatePolicy.metadata(15,"0.6.1",26,UpdatePolicy.MAX_APK_BYTES+1,hash,"https://example.com/app.apk"));
        rejected(() -> UpdatePolicy.metadata(15,"0.6.1",26,100,"invalid","https://example.com/app.apk"));
        java.io.File file = java.io.File.createTempFile("update-policy", ".apk", new java.io.File(args[0]));
        try {
            java.nio.file.Files.write(file.toPath(), new byte[]{97,98,99});
            String expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
            UpdatePolicy.verifyDigest(file,3,expected); checks++;
            try { UpdatePolicy.verifyDigest(file,4,expected); throw new AssertionError("Size mismatch accepted"); } catch(java.io.IOException ok) { checks++; }
            java.nio.file.Files.write(file.toPath(), new byte[]{97,98,100});
            try { UpdatePolicy.verifyDigest(file,3,expected); throw new AssertionError("Tampered file accepted"); } catch(java.io.IOException ok) { checks++; }
        } finally { java.nio.file.Files.delete(file.toPath()); }
        System.out.println("Update policy: " + checks + " checks passed");
    }
}
