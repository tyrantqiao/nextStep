package com.nextstep.training;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public final class HealthPrivacyActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        TextView text = new TextView(this);
        text.setText("NextStep 步数数据说明\n\n仅在您授权后读取 Health Connect 最近七天的每日步数，用于今日活动和趋势展示。\n\n不向 Health Connect 写入数据，不读取心率、睡眠或定位，不上传数据，也不进行后台持续读取。\n\n步数按日期保存于本机应用数据中，包含步数、来源和同步时间。刷新同一天更新累计值，不重复追加。导出 JSON 时包含已保存的步数记录，请按需保管导出文件。\n\n您可以随时在 Health Connect 中撤销 NextStep 的步数权限，停止后续读取；撤销授权不会删除已经保存的本地步数记录。手机或手表未同步的数据可能暂时无法显示。\n\n日常步数与训练记录分别统计，不自动换算运动时长或热量。");
        text.setTextSize(18);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        text.setPadding(padding, padding, padding, padding);
        android.widget.ScrollView scroll = new android.widget.ScrollView(this);
        scroll.addView(text);
        setContentView(scroll);
    }
}
