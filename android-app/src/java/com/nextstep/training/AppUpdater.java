package com.nextstep.training;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import java.io.*;
import java.net.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import org.json.JSONObject;

/** Network requests are native-only; never sends profile or activity records. */
final class AppUpdater {
    interface Listener { void changed(); }
    interface Verified { void ready(File apk); }
    private static AppUpdater instance;
    static synchronized AppUpdater get(Context context) {
        if (instance == null) instance = new AppUpdater(context.getApplicationContext());
        return instance;
    }
    final Context context;
    final SharedPreferences prefs;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Set<Listener> listeners = new HashSet<>();
    private boolean busy;
    String state = "idle", message = "尚未检查更新";
    int progress;
    JSONObject release;
    final long installedCode;
    final String installedName;
    private AppUpdater(Context context) {
        this.context = context;
        prefs = context.getSharedPreferences("nextstep.updates", Context.MODE_PRIVATE);
        long code = 0; String name = "未知";
        try { PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            code = version(info); name = info.versionName; } catch (Exception ignored) { }
        installedCode = code; installedName = name;
        try {
            JSONObject cached = new JSONObject(prefs.getString("release", "{}"));
            validate(cached);
            if (UpdatePolicy.newer(installedCode, cached.getLong("versionCode"))) {
                release = cached; state = apk().isFile() ? "ready" : "available";
                message = apk().isFile() ? "新版已下载，安装前会再次校验" : "有新版可下载";
            } else { apk().delete(); prefs.edit().remove("release").apply(); }
        } catch (Exception ignored) { }
    }
    void add(Listener listener) { listeners.add(listener); listener.changed(); }
    void remove(Listener listener) { listeners.remove(listener); }
    private void notifyChanged() { for (Listener listener : new ArrayList<>(listeners)) listener.changed(); }
    private void publish(String state, String message, int progress) {
        main.post(() -> { this.state = state; this.message = message; this.progress = progress; notifyChanged(); });
    }
    private synchronized boolean begin(String state, String message) {
        if (busy) return false; busy = true; this.state = state; this.message = message; progress = 0; notifyChanged(); return true;
    }
    private void finish(String state, String message) {
        main.post(() -> { synchronized (this) { busy = false; } this.state = state; this.message = message; notifyChanged(); });
    }
    synchronized boolean busy() { return busy; }
    String source() { return prefs.getString("source", UpdatePolicy.DEFAULT_SOURCE); }
    boolean automatic() { return prefs.getBoolean("automatic", true); }
    boolean autoDownload() { return prefs.getBoolean("autoDownload", true); }
    boolean preferences(boolean automatic, boolean download) {
        boolean saved = prefs.edit().putBoolean("automatic", automatic).putBoolean("autoDownload", download).commit();
        if (!saved) message = "更新偏好保存失败，请重试";
        notifyChanged(); return saved;
    }
    boolean source(String value) {
        if (busy()) return false;
        try {
            UpdatePolicy.https(value);
            if (!prefs.edit().putString("source", value).remove("release").remove("lastCheck").remove("lastAttempt").commit()) throw new IOException();
            release = null; apk().delete(); state = "idle"; message = "更新源已保存，可以检查更新"; notifyChanged(); return true;
        } catch (Exception error) { message = error instanceof IllegalArgumentException ? error.getMessage() : "更新源保存失败"; notifyChanged(); return false; }
    }
    private boolean wifi() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) && !cm.isActiveNetworkMetered()
            && !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_CAPTIVE_PORTAL);
    }
    void automaticCheck() {
        if (!automatic() || source().isEmpty() || busy()) return;
        long last = prefs.getLong("lastAttempt", 0), now = System.currentTimeMillis();
        if (now < last || now - last >= 12L * 60 * 60 * 1000) check(true);
        else if (release != null && !apk().isFile() && autoDownload() && wifi()) download(true);
    }
    private static long version(PackageInfo info) { return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode; }
    private void validate(JSONObject info) throws Exception {
        if (!context.getPackageName().equals(info.getString("packageName"))) throw new IOException("更新包名不匹配");
        UpdatePolicy.metadata(info.getLong("versionCode"), info.getString("versionName"), info.getInt("minSdk"),
            info.getLong("size"), info.getString("sha256"), info.getString("apkUrl"));
        if (info.getInt("minSdk") > Build.VERSION.SDK_INT) throw new IOException("新版不支持当前 Android 版本");
        if (info.optString("notes").length() > 4000) throw new IOException("更新说明过长");
    }
    void check(boolean automatic) {
        if (source().isEmpty()) { message = "请先设置更新源地址"; notifyChanged(); return; }
        if (!begin("checking", "正在检查更新…")) return;
        if (!prefs.edit().putLong("lastAttempt", System.currentTimeMillis()).commit()) {
            finish("error", "检查时间保存失败，请重试"); return;
        }
        final String endpoint = source();
        worker.execute(() -> {
            try {
                JSONObject info = new JSONObject(new String(fetch(endpoint, 65536), java.nio.charset.StandardCharsets.UTF_8));
                validate(info);
                if (!prefs.edit().putLong("lastCheck", System.currentTimeMillis()).commit()) throw new IOException("检查时间保存失败");
                if (!UpdatePolicy.newer(installedCode, info.getLong("versionCode"))) {
                    if (!prefs.edit().remove("release").commit()) throw new IOException("更新状态保存失败");
                    apk().delete(); main.post(() -> release = null);
                    finish("current", "当前已是更新源提供的最新版本"); return;
                }
                JSONObject previous = release;
                boolean identical = previous != null && previous.getString("sha256").equalsIgnoreCase(info.getString("sha256"))
                    && previous.getLong("versionCode") == info.getLong("versionCode");
                if (!prefs.edit().putString("release", info.toString()).commit()) throw new IOException("更新信息保存失败");
                if (!identical) apk().delete();
                main.post(() -> {
                    release = info; synchronized (this) { busy = false; }
                    state = apk().isFile() ? "ready" : "available";
                    message = apk().isFile() ? "新版已下载，点击安装更新" : "发现新版，可以下载更新"; notifyChanged();
                    if (autoDownload() && wifi() && !apk().isFile()) download(true);
                });
            } catch (Exception error) {
                finish(release != null ? (apk().isFile() ? "ready" : "available") : "error", explain(error, "检查更新失败"));
            }
        });
    }
    private String explain(Exception error, String action) {
        if (error instanceof UnknownHostException || error instanceof SocketTimeoutException)
            return action + "，请检查网络或稍后重试";
        if (error instanceof org.json.JSONException) return action + "：更新源未返回有效的 JSON，请确认发布配置";
        return action + "：" + (error.getMessage() == null ? "请重试" : error.getMessage());
    }
    File apk() { return new File(new File(context.getFilesDir(), "updates"), "update.apk"); }
    void download() {
        download(false);
    }
    private void download(boolean wifiOnly) {
        if (release == null || !begin("downloading", "正在下载新版…")) return;
        final JSONObject info = release;
        worker.execute(() -> {
            File part = new File(apk().getParentFile(), "update.part");
            HttpURLConnection connection = null;
            try {
                validate(info);
                if (wifiOnly && !wifi()) throw new IOException("自动下载需要不计费 Wi-Fi");
                if (!apk().getParentFile().isDirectory() && !apk().getParentFile().mkdirs()) throw new IOException("无法创建下载目录");
                long expected = info.getLong("size"), done = 0;
                connection = connection(info.getString("apkUrl"));
                long length = connection.getContentLengthLong();
                if (length > 0 && length != expected) throw new IOException("下载文件大小与发布信息不符");
                try (InputStream input = connection.getInputStream(); OutputStream output = new FileOutputStream(part)) {
                    byte[] buffer = new byte[32768]; int n, lastProgress = -1;
                    long deadline = System.currentTimeMillis() + 10L * 60 * 1000;
                    while ((n = input.read(buffer)) != -1) {
                        done += n;
                        if (wifiOnly && !wifi()) throw new IOException("Wi-Fi 已断开，自动下载已停止，可稍后重试");
                        if (done > expected || System.currentTimeMillis() > deadline) throw new IOException("下载超出大小或时间限制");
                        output.write(buffer, 0, n); int percent = (int)(done * 100 / expected);
                        if (percent != lastProgress) { lastProgress = percent; publish("downloading", "正在下载新版…", percent); }
                    }
                }
                verify(part, info);
                if (!part.renameTo(apk())) throw new IOException("无法保存下载文件");
                finish("ready", "新版已下载并校验，点击安装更新");
            } catch (Exception error) { part.delete(); finish("available", explain(error, "下载更新失败")); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }
    void verifyForInstall(Verified callback) {
        if (release == null || !begin("verifying", "正在校验安装包…")) return;
        final JSONObject info = release;
        worker.execute(() -> {
            try {
                verify(apk(), info);
                main.post(() -> { synchronized (this) { busy = false; } state = "ready"; message = "请在系统页面确认安装"; notifyChanged(); callback.ready(apk()); });
            } catch (Exception error) { apk().delete(); finish("available", explain(error, "安装包校验失败")); }
        });
    }
    private void verify(File file, JSONObject info) throws Exception {
        validate(info);
        if (!UpdatePolicy.newer(installedCode, info.getLong("versionCode"))) throw new IOException("拒绝安装旧版本");
        if (file.length() != info.getLong("size")) throw new IOException("安装包大小校验失败");
        UpdatePolicy.verifyDigest(file, info.getLong("size"), info.getString("sha256"));
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo offered = context.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(), flags);
        PackageInfo installed = context.getPackageManager().getPackageInfo(context.getPackageName(), flags);
        if (offered == null || !context.getPackageName().equals(offered.packageName) || version(offered) != info.getLong("versionCode")
                || !info.getString("versionName").equals(offered.versionName)
                || offered.applicationInfo.minSdkVersion > Build.VERSION.SDK_INT) throw new IOException("安装包的应用或版本不匹配");
        if (!signers(installed).equals(signers(offered)) || signers(installed).isEmpty()) throw new IOException("安装包签名与当前应用不一致");
    }
    private Set<String> signers(PackageInfo info) throws Exception {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28
            ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        Set<String> values = new HashSet<>();
        if (signatures != null) for (Signature s : signatures) values.add(UpdatePolicy.hex(MessageDigest.getInstance("SHA-256").digest(s.toByteArray())));
        return values;
    }
    private static HttpURLConnection connection(String address) throws Exception {
        URI uri = UpdatePolicy.https(address);
        for (int hop = 0; hop < 6; hop++) {
            HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(15000); connection.setReadTimeout(20000);
            connection.setRequestProperty("Accept-Encoding", "identity"); connection.setRequestProperty("User-Agent", "NextStep-Updater");
            connection.setUseCaches(false);
            int code;
            try { code = connection.getResponseCode(); } catch (Exception error) { connection.disconnect(); throw error; }
            if (code == 200) return connection;
            String location = connection.getHeaderField("Location"); connection.disconnect();
            if (code >= 300 && code < 400 && location != null) { uri = UpdatePolicy.https(uri.resolve(location).toString()); continue; }
            throw new IOException(code == 404 ? "更新源尚未发布文件（404）" : "服务器返回 HTTP " + code);
        }
        throw new IOException("更新地址重定向过多");
    }
    private static byte[] fetch(String address, int limit) throws Exception {
        HttpURLConnection connection = connection(address);
        try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096]; int n; long deadline = System.currentTimeMillis() + 30000;
            while ((n = input.read(buffer)) != -1) { if (output.size() + n > limit || System.currentTimeMillis() > deadline) throw new IOException("更新信息过大或读取超时"); output.write(buffer,0,n); }
            return output.toByteArray();
        } finally { connection.disconnect(); }
    }
}
