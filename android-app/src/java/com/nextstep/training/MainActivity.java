package com.nextstep.training;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.view.View;
import android.view.WindowInsets;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.json.JSONObject;

/** Offline WebView shell. The web assets are copied from nextstep-web/dist at build time. */
public final class MainActivity extends Activity implements AppUpdater.Listener {
    private static final String ORIGIN = "https://app.nextstep.local";
    private static final int EXPORT_REQUEST = 41;
    private WebView webView;
    private byte[] pendingExport;
    private boolean healthBusy;
    private int healthGeneration;
    private static final String READ_STEPS = "android.permission.health.READ_STEPS";
    private long announcedUpdate;
    private long announcedAvailable;

    @Override public void changed() {
        AppUpdater updater = AppUpdater.get(this);
        long code = updater.release == null ? 0 : updater.release.optLong("versionCode");
        if ("ready".equals(updater.state) && code > announcedUpdate) {
            announcedUpdate = code; message("新版已下载，进入设置的「应用更新」即可安装");
        } else if ("available".equals(updater.state) && code > announcedAvailable) {
            announcedAvailable = code; message("发现新版，进入设置的「应用更新」即可下载");
        }
    }

    @Override protected void onPause() {
        AppUpdater.get(this).remove(this); super.onPause();
    }

    private void sendHealth(JSONObject value) {
        if (webView == null || isFinishing() || isDestroyed()) return;
        webView.evaluateJavascript("window.nextstepHealthResult&&window.nextstepHealthResult(" + value.toString() + ")", null);
    }

    private void readHealth(boolean authorize) {
        if (android.os.Build.VERSION.SDK_INT < 34) {
            sendHealth(healthStatus("unavailable", "此测试版需要 Android 14 及以上的 Health Connect")); return;
        }
        if (!HealthSteps.available(this)) {
            sendHealth(healthStatus("unavailable", "手机的 Health Connect 服务不可用")); return;
        }
        if (checkSelfPermission(READ_STEPS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            healthGeneration++; healthBusy = false;
            sendHealth(healthStatus("permission", "请允许 NextStep 读取步数"));
            if (authorize) requestPermissions(new String[]{READ_STEPS}, 42);
            return;
        }
        if (healthBusy) return;
        healthBusy = true;
        final int generation = ++healthGeneration;
        webView.postDelayed(() -> {
            if (generation != healthGeneration || !healthBusy) return;
            healthBusy = false; healthGeneration++;
            sendHealth(healthStatus("error", "读取超时，请重试或打开 Health Connect 检查"));
        }, 20000);
        HealthSteps.read(this, value -> {
            if (generation != healthGeneration) return;
            healthBusy = false;
            if (checkSelfPermission(READ_STEPS) != android.content.pm.PackageManager.PERMISSION_GRANTED)
                value = healthStatus("permission", "步数权限已撤销");
            sendHealth(value);
        });
    }

    private JSONObject healthStatus(String status, String message) {
        JSONObject value = new JSONObject();
        try { value.put("status", status).put("message", message); } catch (Exception ignored) { }
        return value;
    }

    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == 42) readHealth(false);
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.evaluateJavascript("window.refreshHealthSteps&&window.refreshHealthSteps(false)", null);
        AppUpdater.get(this).add(this);
        AppUpdater.get(this).automaticCheck();
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(245, 246, 248));
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(245, 246, 248));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets keyboard = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets.consumeSystemWindowInsets();
        });
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        root.requestApplyInsets();
        webView.setBackgroundColor(Color.rgb(245, 246, 248));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setTextZoom(100);
        if (android.os.Build.VERSION.SDK_INT >= 29) settings.setForceDark(WebSettings.FORCE_DARK_OFF);
        if (android.os.Build.VERSION.SDK_INT >= 33) settings.setAlgorithmicDarkeningAllowed(false);
        webView.addJavascriptInterface(new ExportBridge(), "NextStepAndroid");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new LocalContentClient());
        webView.loadUrl(ORIGIN + "/index.html");
    }

    private final class LocalContentClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!"https".equals(uri.getScheme()) || !"app.nextstep.local".equals(uri.getHost())) {
                return errorResponse(403, "Forbidden");
            }
            String file = uri.getPath();
            if (file == null || file.equals("/")) file = "/index.html";
            if (file.contains("..") || file.contains("\\")) return errorResponse(403, "Forbidden");
            String mime = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript"
                : file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
            try {
                return new WebResourceResponse(mime, "UTF-8", 200, "OK",
                    Collections.singletonMap("Cache-Control", "no-cache"), getAssets().open("www" + file));
            } catch (IOException error) {
                return errorResponse(404, "Not Found");
            }
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if ("https".equals(uri.getScheme()) && "app.nextstep.local".equals(uri.getHost())) return false;
            // Keep external pages out of the WebView that owns the local-only export bridge.
            if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (ActivityNotFoundException error) { message("未找到可打开链接的浏览器"); }
            }
            return true;
        }
    }

    private WebResourceResponse errorResponse(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason,
            Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    public final class ExportBridge {
        @JavascriptInterface public void openAppUpdates() {
            runOnUiThread(() -> startActivity(new Intent(MainActivity.this, UpdateActivity.class)));
        }
        @JavascriptInterface public void readHealthSteps(boolean authorize) {
            runOnUiThread(() -> {
                try { readHealth(authorize); }
                catch (Exception error) {
                    healthBusy = false; healthGeneration++;
                    sendHealth(healthStatus("error", "无法访问 Health Connect，请检查系统服务后重试"));
                }
            });
        }
        @JavascriptInterface public void openHealthSettings() {
            runOnUiThread(() -> {
                try { startActivity(new Intent("android.health.connect.action.HEALTH_HOME_SETTINGS")); }
                catch (ActivityNotFoundException error) { message("请在手机设置中搜索 Health Connect"); }
            });
        }
        @JavascriptInterface public void showHealthPrivacy() {
            runOnUiThread(() -> startActivity(new Intent(MainActivity.this, HealthPrivacyActivity.class)));
        }
        @JavascriptInterface public void exportRecords(String json) {
            if (json == null || json.length() > 5_000_000) { message("导出内容过大"); return; }
            try {
                JSONObject data = new JSONObject(json);
                if (data.optJSONArray("records") == null || data.optJSONObject("profile") == null) {
                    message("导出数据格式无效"); return;
                }
            } catch (Exception error) { message("导出数据格式无效"); return; }
            runOnUiThread(() -> {
                if (pendingExport != null) { message("请先完成当前导出"); return; }
                pendingExport = json.getBytes(StandardCharsets.UTF_8);
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "nextstep-training.json");
                try { startActivityForResult(intent, EXPORT_REQUEST); }
                catch (ActivityNotFoundException error) { pendingExport = null; message("未找到文件保存应用"); }
            });
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent result) {
        super.onActivityResult(requestCode, resultCode, result);
        if (requestCode != EXPORT_REQUEST) return;
        byte[] data = pendingExport;
        pendingExport = null;
        if (resultCode != RESULT_OK || result == null || result.getData() == null || data == null) {
            message("已取消导出"); return;
        }
        try (OutputStream stream = getContentResolver().openOutputStream(result.getData())) {
            if (stream == null) throw new IOException("No output stream");
            stream.write(data);
            message("训练记录已导出");
        } catch (IOException error) { message("文件保存失败，请重试"); }
    }

    private void message(String text) {
        runOnUiThread(() -> Toast.makeText(this, text, Toast.LENGTH_SHORT).show());
    }

    @Override public void onBackPressed() {
        webView.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');"
            + "if(d){d.close();return 'closed'};if(location.hash&&location.hash!=='#today'){"
            + "location.hash='today';window.scrollTo(0,0);return 'home'};return 'exit'})()",
            result -> { if ("\"exit\"".equals(result)) finish(); });
    }

    @Override protected void onDestroy() {
        if (webView != null) { webView.removeJavascriptInterface("NextStepAndroid"); webView.destroy(); }
        super.onDestroy();
    }
}
