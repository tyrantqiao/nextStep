package com.nextstep.training;

import android.app.Activity;
import android.health.connect.*;
import android.health.connect.datatypes.StepsRecord;
import android.health.connect.datatypes.DataOrigin;
import android.os.OutcomeReceiver;
import java.time.*;
import java.util.LinkedHashSet;
import org.json.*;

/** Android 14+ only. Called behind an SDK guard; never writes health records. */
final class HealthSteps {
    interface Result { void complete(JSONObject value); }
    static boolean available(Activity activity) {
        return activity.getSystemService(HealthConnectManager.class) != null;
    }
    static void read(Activity activity, Result result) {
        HealthConnectManager manager = activity.getSystemService(HealthConnectManager.class);
        if (manager == null) { result.complete(status("unavailable", "手机的 Health Connect 服务不可用")); return; }
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        readDay(activity, manager, zone, today, 0, new JSONArray(), new LinkedHashSet<String>(), result);
    }
    private static void readDay(Activity activity, HealthConnectManager manager, ZoneId zone,
            LocalDate today, int index, JSONArray days, LinkedHashSet<String> sources, Result result) {
        LocalDate date = today.minusDays(6 - index);
        Instant start = date.atStartOfDay(zone).toInstant();
        Instant end = index == 6 ? Instant.now() : date.plusDays(1).atStartOfDay(zone).toInstant();
        AggregateRecordsRequest<Long> request = new AggregateRecordsRequest.Builder<Long>(
            new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(end).build())
            .addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build();
        try {
            manager.aggregate(request, activity.getMainExecutor(), new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                @Override public void onResult(AggregateRecordsResponse<Long> response) {
                    try {
                        Long count = response.get(StepsRecord.STEPS_COUNT_TOTAL);
                        JSONArray daySources = new JSONArray();
                        for (DataOrigin origin : response.getDataOrigins(StepsRecord.STEPS_COUNT_TOTAL)) {
                            sources.add(origin.getPackageName()); daySources.put(origin.getPackageName());
                        }
                        days.put(new JSONObject().put("date", date.toString())
                            .put("steps", count == null ? JSONObject.NULL : count).put("sources", daySources));
                        if (index < 6) { readDay(activity, manager, zone, today, index + 1, days, sources, result); return; }
                        result.complete(status("ready", "已读取 Health Connect 步数")
                            .put("days", days).put("sources", new JSONArray(sources))
                            .put("syncedAt", System.currentTimeMillis()));
                    } catch (Exception error) { result.complete(status("error", "步数读取失败，请重试")); }
                }
                @Override public void onError(HealthConnectException error) {
                    result.complete(status(error.getErrorCode() == HealthConnectException.ERROR_SECURITY ? "permission" : "error",
                        error.getErrorCode() == HealthConnectException.ERROR_SECURITY ? "请允许 NextStep 读取步数" : "Health Connect 读取失败（错误码 " + error.getErrorCode() + "），请稍后重试"));
                }
            });
        } catch (SecurityException error) { result.complete(status("permission", "请允许 NextStep 读取步数")); }
        catch (Exception error) { result.complete(status("error", "Health Connect 读取失败，请重试")); }
    }
    static JSONObject status(String status, String message) {
        JSONObject value = new JSONObject();
        try { value.put("status", status).put("message", message); } catch (JSONException ignored) { }
        return value;
    }
}
