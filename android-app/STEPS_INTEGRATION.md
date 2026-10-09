# OPPO / ColorOS 步数接入调查

调查日期：2026-10-09。当前代码仍使用 Health Connect；本文是接入评估，未实现 OPPO 直连，也未把 Health Connect 自动切为备用。

## 当前行为

MainActivity 在加载与返回前台时读取数据，记录页支持手动刷新。HealthSteps 使用 API 34+ 原生 Health Connect 按本地自然日聚合最近七天，今天截至读取时刻。没有后台定时同步。来源健康应用何时写入数据，不由 NextStep 控制；不能将数据缺失统一归因为 Health Connect 固定同步周期。

## 手机系统步数与穿戴设备

本次公开资料检索未确认普通第三方应用可直接读取 ColorOS 手机健康应用全天步数的官方接口。不能据此认定接口不存在，也不能使用猜测的 ContentProvider URI 或私有接口冒充已支持。

OPPO 官方文档检索结果中的 Wear Engine SDK 使用协议涉及穿戴设备的每日活动数据（步数等）。这不能证明同一接口可以读取手机自身的计步总数。接入前需取得对应 SDK 文档，确认支持设备、授权流程、申请资格、签名校验和可读取日期范围。有 OPPO Watch 时可另行评估穿戴接入。

## 可落地的独立计步方案

Android SensorManager 的 TYPE_STEP_COUNTER 可读取传感器激活期间、最近一次重启以来的累计步数，Android 10+ 需要 ACTIVITY_RECOGNITION 权限，并需检查硬件是否存在。它不是 OPPO 健康历史同步接口，首次启用无法据此还原今日零点到启用前的步数。

若采用此方案，界面应明确称为「手机直接计步」，持久化本地日期、传感器基线、重启状态和最后读取时间。跨午夜且无边界样本时，不能把整个增量都归入今天；重启或权限撤销期间缺失不能填为真实 0。ColorOS 后台限制和锁屏持续计步需要真机确认，不能承诺关闭应用仍实时更新。

早期备选设想是以直接计步作为日常更新来源、Health Connect 作为历史补齐；下文官方新能力核实后，优先建议先验证 Health Connect 手机原生计步，再决定是否需要独立计步。两种来源不能直接相加；目前 activityRecords 按日期保存单条 health-connect 记录，新增来源前需兼容迁移并定义完整全天值与部分时段计步的优先关系，防止不完整传感器值覆盖已有完整健康记录。

## 真机核实清单

记录 OPPO 型号、ColorOS / Android / 健康应用版本及是否连接手表。分别对照手机健康与 Health Connect 的今日数据、更新时间、来源共享设置；测试步行后刷新与返回前台。独立计步方案还需测试首次授权、跨日、重启、锁屏、进程结束、撤销权限和保存失败。

## 官方参考

- [Android 运动传感器](https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion)
- [Sensor.TYPE_STEP_COUNTER](https://developer.android.com/reference/android/hardware/Sensor#TYPE_STEP_COUNTER)
- [Health Connect 读取数据](https://developer.android.com/health-and-fitness/health-connect/read-data)
- [OPPO 官方文档检索：ColorOS Watch / Wear Engine 协议](https://open.oppomobile.com/documentation/page/search?keyword=ColorOS+Watch)

当前缺少可确认的 OPPO 手机直连接口文档与真机验证，因此保留现有 Health Connect 功能，不在应用中展示未实现的 OPPO 连接按钮。


## Android 官方 API 补充调研（2026-10-09）

重要修正：Health Connect 不只是来源应用的数据仓库。Android 14 / API 34 且 SDK Extension >=20 支持手机原生计步，至少一个应用获 READ_STEPS 后开始采集；用户可关闭原生追踪。官方说明通常按批次写入、不频于每分钟一次，这不是严格一分钟刷新 SLA，也不意味着必须等 OPPO 健康同步。不能根据 ColorOS 版本直接推定此能力存在，应检查扩展版本、服务与实际数据。

2026 年 6 月后原生步数来源由 android 改为设备与应用作用域的合成包名 SPN。不能硬编码来源包名；不筛选 DataOrigin 的聚合查询会自动包含原生步数。精确获取当前手机来源的 getCurrentDeviceDataSource 需要扩展版本 >=22 和相应编译 API。NextStep 当前 HealthSteps 使用框架 aggregate、未限定 DataOrigin，按官方文档推断无需改聚合方式即可包含支持设备的原生步数；未真机确认。

[原生步数与扩展要求](https://developer.android.com/health-and-fitness/health-connect/features/steps)

Health Connect 可存取步数、运动、心率、睡眠、体重、血氧等健康类型，按类型授权。数据必须已由来源写入或由受支持的原生追踪生成。最新文档还列出原生距离与活动热量估算，不能把估算当作实测，具体设备能力仍需验证。

[数据类型与权限](https://developer.android.com/health-and-fitness/health-connect/data-types)
[原生追踪](https://developer.android.com/health-and-fitness/health-connect/features/native-tracking)

手机独立采集还有两条路线：

- SensorManager：系统硬件 API，无 Google Play services 依赖；TYPE_STEP_COUNTER 需自行管理累计值、日期边界、重启、进程及后台生命周期。不能读其他健康应用的完整历史。
- Recording API on mobile：FitnessLocal / LocalRecordingClient，支持步数、距离与热量，本地存储、无需 Google 账户；需要可用且达到版本要求的 Google Play services 与 ACTIVITY_RECOGNITION。订阅后采集、最多可读十天缓存，不能补订阅前历史，取消订阅后采集数据不可访问。现有无 Gradle 项目要评估新增 Google SDK 依赖成本；不能假设国行 OPPO 已具备该服务。

[SensorManager 指引](https://developer.android.com/health-and-fitness/fitness/basic-app/read-step-count-data)
[Recording API](https://developer.android.com/health-and-fitness/recording-api)

Wear OS 3+ 的 Health Services 主要用于手表：MeasureClient 短时测量、ExerciseClient 运动过程、PassiveMonitoringClient 被动监测。不是手机读取 OPPO 健康数据的通用接口，OPPO 手表需确认实际系统和 SDK 支持。

[Health Services](https://developer.android.com/health-and-fitness/health-services)

健康仓库同步建议：步数使用 aggregate 避免多来源重复相加；返回前台和前台适度轮询读取最新值。后台读取额外需要 READ_HEALTH_DATA_IN_BACKGROUND，并检查功能支持；它不控制来源写入频率。默认读取范围可追溯至首次授权前 30 天，不是只能读滚动最近 30 天；更早历史需要 READ_HEALTH_DATA_HISTORY 与功能支持。增量同步可使用 Changes token，但不是实时推送，未使用 token 30 天会过期，需重新查询与去重。

[聚合与优先级](https://developer.android.com/health-and-fitness/health-connect/aggregate-data)
[同步策略](https://developer.android.com/health-and-fitness/health-connect/sync-data)

旧 Google Fit API 官方迁移文档明确支持至 2026 年底，不建议新项目接入。移动健康数据优先 Health Connect；云端账号整合是另一类需求，不适合当前本地优先范围。

[Google Fit 迁移](https://developer.android.com/health-and-fitness/health-connect/migration/fit)

下一步建议：先增加设备能力诊断（Android / 扩展版本 / Health Connect 可用性 / 权限 / 聚合来源），在 Find X8 Ultra 上对照步行前后数据验证手机原生计步；支持时保留 Health Connect 主路径。若实机不支持而又需要及时计步，再评估 SensorManager 主路径、Health Connect 历史备用，来源分开保存、禁止相加或以部分计步覆盖完整全天值。本次只调研，未修改应用逻辑、未真机测试、未构建 APK。
