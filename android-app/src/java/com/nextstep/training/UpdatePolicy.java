package com.nextstep.training;

import java.net.URI;
import java.util.Locale;
import java.io.*;
import java.security.MessageDigest;

/** Shared validation rules, deliberately independent of Android for JVM tests. */
final class UpdatePolicy {
    static final String DEFAULT_SOURCE = "https://github.com/tyrantqiao/nextStep/releases/latest/download/update.json";
    static final long MAX_APK_BYTES = 100L * 1024 * 1024;
    static URI https(String value) {
        try {
            URI uri = new URI(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getFragment() != null) throw new Exception();
            return uri;
        } catch (Exception error) { throw new IllegalArgumentException("更新地址必须是有效的 HTTPS 地址"); }
    }
    static void metadata(long version, String name, int minSdk, long size, String sha256, String url) {
        https(url);
        if (version < 1 || version > Integer.MAX_VALUE || name == null || name.trim().isEmpty()
                || name.length() > 80 || minSdk < 26 || size < 1 || size > MAX_APK_BYTES
                || sha256 == null || !sha256.matches("[0-9a-fA-F]{64}"))
            throw new IllegalArgumentException("更新信息格式无效");
    }
    static boolean newer(long installed, long offered) { return offered > installed; }
    static void verifyDigest(File file, long size, String hash) throws Exception {
        if (file.length() != size) throw new IOException("安装包大小校验失败");
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[32768]; int n; while ((n = input.read(buffer)) != -1) digest.update(buffer,0,n);
        }
        if (!hex(digest.digest()).equalsIgnoreCase(hash)) throw new IOException("安装包 SHA256 校验失败");
    }
    static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) result.append(String.format(Locale.ROOT, "%02x", b & 255));
        return result.toString();
    }
}
