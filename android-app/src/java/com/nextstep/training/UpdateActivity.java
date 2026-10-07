package com.nextstep.training;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.*;
import java.util.Locale;

public final class UpdateActivity extends Activity implements AppUpdater.Listener {
    private AppUpdater updater;
    private TextView status, release, source;
    private Button check, download, install, configure;
    private ProgressBar progress;
    private boolean pendingPermission;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        pendingPermission = state != null && state.getBoolean("pendingPermission");
        updater = AppUpdater.get(this);
        ScrollView scroll = new ScrollView(this); LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL); int pad = (int)(24*getResources().getDisplayMetrics().density);
        layout.setPadding(pad,pad,pad,pad);
        scroll.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
            } else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        scroll.addView(layout); setContentView(scroll); scroll.requestApplyInsets();
        TextView title = text(layout, "应用更新", 26);
        text(layout, "当前版本 " + updater.installedName + "（" + updater.installedCode + "）", 16);
        status = text(layout, "", 18); status.setAccessibilityLiveRegion(android.view.View.ACCESSIBILITY_LIVE_REGION_POLITE);
        release = text(layout, "", 15);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); progress.setMax(100); layout.addView(progress);
        check = button(layout, "检查更新", () -> updater.check(false));
        download = button(layout, "下载新版", () -> updater.download());
        install = button(layout, "安装更新", this::install);
        Switch automatic = new Switch(this); automatic.setText("打开应用时自动检查更新"); automatic.setChecked(updater.automatic()); layout.addView(automatic);
        Switch autoDownload = new Switch(this); autoDownload.setText("在不计费 Wi-Fi 下自动下载新版"); autoDownload.setChecked(updater.autoDownload()); layout.addView(autoDownload);
        automatic.setOnCheckedChangeListener((view, checked) -> { if(!updater.preferences(checked, autoDownload.isChecked()))automatic.setChecked(updater.automatic()); else if(checked)updater.automaticCheck(); });
        autoDownload.setOnCheckedChangeListener((view, checked) -> { if(!updater.preferences(automatic.isChecked(), checked))autoDownload.setChecked(updater.autoDownload()); else if(checked)updater.automaticCheck(); });
        text(layout, "自动检查每 12 小时最多一次，在应用打开或返回前台时执行。下载不影响记录使用；安装仍需要系统确认。安装时请先保存正在填写的内容。", 14);
        source = text(layout, "", 13);
        configure = button(layout, "设置更新源", this::configure);
        text(layout, "更新只请求版本信息和安装包，不上传个人资料、步数或训练记录。首次安装更新可能需要允许 NextStep 安装应用。覆盖升级保留本地数据，请勿卸载旧版。", 14);
        button(layout, "返回", this::finish);
    }
    private TextView text(LinearLayout layout, String value, int size) {
        TextView text = new TextView(this); text.setText(value); text.setTextSize(size); text.setPadding(0,12,0,12); layout.addView(text); return text;
    }
    private Button button(LinearLayout layout, String value, Runnable action) {
        Button button = new Button(this); button.setText(value); button.setOnClickListener(view -> action.run()); layout.addView(button); return button;
    }
    @Override protected void onResume() { super.onResume(); updater.add(this); }
    @Override protected void onPause() { updater.remove(this); super.onPause(); }
    @Override protected void onSaveInstanceState(Bundle state) { state.putBoolean("pendingPermission", pendingPermission); super.onSaveInstanceState(state); }
    @Override public void changed() {
        if (isFinishing() || isDestroyed()) return;
        status.setText(updater.message);
        source.setText("更新源：" + (updater.source().isEmpty() ? "尚未配置" : updater.source()));
        String details = "";
        if (updater.release != null) details = "新版 " + updater.release.optString("versionName") + " · "
            + String.format(Locale.CHINA, "%.2f MB", updater.release.optLong("size")/1048576.0)
            + "\n" + updater.release.optString("notes", "");
        release.setText(details);
        boolean busy = updater.busy(); check.setEnabled(!busy); configure.setEnabled(!busy);
        download.setVisibility(updater.release != null && !updater.apk().isFile() ? android.view.View.VISIBLE : android.view.View.GONE);
        download.setEnabled(!busy);
        install.setVisibility(updater.release != null && updater.apk().isFile() ? android.view.View.VISIBLE : android.view.View.GONE); install.setEnabled(!busy);
        progress.setVisibility("downloading".equals(updater.state) ? android.view.View.VISIBLE : android.view.View.GONE); progress.setProgress(updater.progress);
    }
    private void configure() {
        EditText input = new EditText(this); input.setSingleLine(false); input.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(updater.source()); input.setHint("https://服务器地址/update.json");
        AlertDialog dialog = new AlertDialog.Builder(this).setTitle("设置更新源").setMessage("填写发布者提供的 HTTPS 更新信息地址。")
            .setView(input).setNegativeButton("取消", null).setPositiveButton("保存", null).create();
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view -> {
            if (updater.source(input.getText().toString().trim())) dialog.dismiss();
            else input.setError(updater.message);
        })); dialog.show();
    }
    private void install() {
        if (updater.busy()) return;
        if (!getPackageManager().canRequestPackageInstalls()) {
            pendingPermission = true;
            try { startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:"+getPackageName())), 52); }
            catch (Exception error) { pendingPermission = false; Toast.makeText(this,"请在系统设置中允许 NextStep 安装应用",Toast.LENGTH_LONG).show(); }
            return;
        }
        updater.verifyForInstall(apk -> {
            if (isFinishing() || isDestroyed()) return;
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(Uri.parse("content://com.nextstep.training.updates/update.apk"), "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.putExtra(Intent.EXTRA_RETURN_RESULT, true);
                startActivityForResult(intent, 53);
            } catch (Exception error) { Toast.makeText(this,"无法打开系统安装页面，请稍后重试",Toast.LENGTH_LONG).show(); }
        });
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if (request == 52 && pendingPermission) {
            pendingPermission = false;
            if (getPackageManager().canRequestPackageInstalls()) install();
            else Toast.makeText(this,"未开启安装权限，已下载的新版会保留",Toast.LENGTH_LONG).show();
        }
        if (request == 53 && result != RESULT_OK) Toast.makeText(this,"安装未完成，可以稍后再次安装",Toast.LENGTH_LONG).show();
    }
}
