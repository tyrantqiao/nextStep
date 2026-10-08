# NextStep 安卓本地体验版 0.6.8

安装包：`dist/NextStep-0.6.8.apk`，支持 Android 8.0 及以上。使用系统 WebView，本地记录离线可用，无需账户。应用更新需要网络和安装应用权限；不上传个人资料或活动记录。步数功能需要 Android 14 及以上、可用的 Health Connect 服务和用户授权。

## 0.6.1 应用更新

入口：设置底部「应用更新 → 检查更新 / 自动更新」，打开原生更新页。支持手动检查、自动检查、下载进度、失败重试、已下载包的安装；默认开启自动检查与不计费 Wi-Fi 自动下载。0.6.3 起每次进程冷启动检查一次，回到前台每 12 小时最多检查一次，失败检查在同一进程内也按该间隔节流；手动检查不受此间隔限制。没有后台定时服务，应用关闭后不会定时检查。自动下载途中断开不计费 Wi-Fi 会停止，重试会重新下载；手动下载可使用当前网络。

自动更新完成下载后，需要点击「安装更新」并在系统安装器确认。首次可能需允许 NextStep 安装应用。没有静默安装、卸载或清空数据；沿用包名、签名和本地 HTTPS 来源，覆盖升级保留已有资料、草稿、训练及步数。请先保存尚未提交的表单内容。

更新请求由原生层通过 HTTPS 发出，WebView 仍只加载本地内容；新增 INTERNET、ACCESS_NETWORK_STATE、REQUEST_INSTALL_PACKAGES 权限。检查只读取发布信息，不发送用户记录。下载校验大小、SHA256、包名、versionCode/versionName、Android 兼容性和当前安装签名；拒绝旧版本、签名不同或损坏的 APK。单个 APK 限 100 MiB，更新信息限 64 KiB，重定向也必须为 HTTPS。安装包保存在应用私有目录，通过只能读取固定 APK 的 ContentProvider 临时交给系统安装器。

默认更新源：`https://github.com/tyrantqiao/nextStep/releases/latest/download/update.json`。使用仓库最新正式 GitHub Release 的版本信息，APK 地址固定到对应版本。自定义源与偏好保存于独立原生 SharedPreferences，升级保留；旧版设置过自定义源的用户可在更新页改回上述地址。0.6.1 已发布至 [GitHub Releases](https://github.com/tyrantqiao/nextStep/releases/tag/v0.6.1)，包含 APK、SHA256 和 update.json。

### 发布新版

先递增 Manifest versionCode/versionName，并同步 build.ps1 的 APK 文件名及校验文件名、README。使用原签名构建并验证。以下命令针对 v0.6.8；发布下一版时同时替换版本号：

```powershell
# 在仓库根目录运行；构建成功后生成 dist/update.json
./android-app/build.ps1 -UpdateBaseUrl 'https://github.com/tyrantqiao/nextStep/releases/download/v0.6.8/'

# 或在已有已校验 APK 上单独生成，可附带 UTF-8 更新说明文件
node android-app/update-manifest.cjs --base-url 'https://github.com/tyrantqiao/nextStep/releases/download/v0.6.8/' --notes-file android-app/release-notes.txt
```

生成器从当前 Manifest 和已构建 APK 读取版本、包名、最低 SDK、大小和 SHA256，要求 APK 与构建校验文件匹配。将输出 APK 上传到 apkUrl 指定的位置，再发布 update.json；不上传 signing/、SDK 或 build/。服务器应正确返回 JSON 与 APK、避免对 update.json 长期缓存。GitHub Releases 也可托管：在最新正式 Release 附加 APK 与 update.json，源地址使用 releases/latest/download/update.json；更新信息中的 apkUrl 应指向该版本的固定 Release 资产地址。先创建草稿 Release，上传 APK、对应 .sha256 和 update.json，检查后再发布为最新正式版。

安装这个版本需要一次手动覆盖安装，之后接入更新源的新版本可直接在应用内下载和安装。真机验证：同版显示最新、有新版时下载并安装；拒绝安装权限或取消安装后可重试；断网、Wi-Fi 变更、错误哈希/签名应失败且保留用户记录。尚未进行 Find X8 Ultra 真机更新验证，GitHub 最新版本信息的公开下载已验证；真机更新仍待验证。

验证命令：

```powershell
node --check nextstep-web/dist/app.js
node --test nextstep-web/tests/journal.test.cjs android-app/tests/update-manifest.test.cjs
./android-app/test-update-policy.ps1
./android-app/build.ps1
```

当前验证：46 项 Node 测试与 19 项 JVM 更新策略检查通过（含 URL、版本、文件大小与哈希篡改）；浏览器以模拟原生桥检查设置入口的 320/390/1280 像素布局。原生下载、签名读取与系统安装需要真机验证；网页模拟不代替安卓测试。


0.5.0 新增 Health Connect 只读步数测试：今日概览显示今日及最近七天每日步数、同步时间和来源包名。点击「连接步数」申请 READ_STEPS 权限；首次页面加载与返回应用时检查权限并读取，支持手动刷新、打开 Health Connect 和数据说明。只在前台读取，不申请心率、睡眠、定位、写入或后台权限。

步数按设备当前本地时区的自然日分别聚合（今天截至读取时刻），由 Health Connect 提供聚合结果。无记录显示 —，与实际 0 步区分；未授权、不可用、超时或读取失败显示相应提示，可重试。0.5.1 起步数保存为独立的每日活动记录，使用 nextstep.activityRecords；同一天刷新更新累计值，不追加重复记录。保存来源及同步时间，长期保留读到的历史日期。暂无数据不写入 0、不抹掉历史；撤销权限后保留本地历史。保存失败保留待保存数据并支持重试；未保存数据不进入历史或导出。训练次数、时长和计划完成统计仍仅计算训练记录。

Find X8 Ultra / ColorOS 16 测试步骤：直接覆盖安装，勿卸载旧版；进入「今日概览」的「每日活动」，连接并允许读取步数。对照 Health Connect 的步数数据检查今日、最近七天和来源；步行后刷新、切换应用后返回；撤销步数授权后返回检查提示。若暂无数据，检查 Health Connect 中是否已有步数，以及来源应用是否启用共享；OPPO 健康本身有步数不保证已共享。

保留既有包名、本地 HTTPS 来源和签名材料用于覆盖升级。验证：42 项业务回归测试、JS 语法检查通过；模拟健康数据在真实浏览器检查 320/390/1280 像素布局；APK 构建、资源校验及 v2/v3 签名校验通过。尚未在 Find X8 Ultra 真机验证权限及健康数据读取。

记录页新增「每日步数记录」，可查看所有已保存日期。浏览器下载及 Android 原生导出统一使用 JSON version=2，保留 profile、records，增加 activityRecords。升级兼容旧训练数据；不提供 JSON 导入。每次仍仅读取最近七天，没有后台同步，超过七天未打开期间更早的缺失日期不会自动补回。

真机补充验证：同步后关闭并重开应用；同一天再次刷新检查只有一条记录；撤销权限检查历史仍可见；导出 JSON 检查 activityRecords 包含日期、步数、来源和同步时间。

实现参考：[HealthConnectManager](https://developer.android.com/reference/android/health/connect/HealthConnectManager)、[Health Connect 接入](https://developer.android.com/health-and-fitness/health-connect/get-started)、[步数读取与聚合](https://developer.android.com/health-and-fitness/health-connect/read-data)。本版通过 API 34+ 原生接口接入，未增加 Gradle 或 AndroidX 依赖。

全新安装不预设个人资料、训练记录或训练计划。首次打开填写身高体重、生活方式、目标和训练偏好，保存后生成规则模板计划。支持逐组记录、续练、记录、设置及 JSON 导出；连续 30 天未使用提醒确认资料。

使用与旧体验版相同的包名和签名，支持覆盖升级。升级保留此前用户录入的数据；卸载会清除本地数据。APK 不包含浏览器试用数据、签名私钥或 SDK。

构建：`./build.ps1`。默认使用项目已有 Android Platform 35、Build-Tools 35 和本机 JDK；路径可通过 JdkPath、BuildToolsPath、PlatformPath 参数修改。构建检查 JavaScript 语法、APK 资源结构、四字节对齐以及 v2/v3 签名，输出 SHA256 校验文件。

将 APK 传到手机点击安装即可。尚未进行真机运行测试。

0.4.0：保存按钮使用明确的深蓝底白字和独立底部操作区；关闭 WebView 自动深色重绘，保持表单颜色一致。

0.4.0：修复本月图表撑开手机页面，统计范围切换改为局部更新；同时治理记录长文本、表单、训练表格和弹窗的窄屏布局。12 项自动检查与 6 种视口验证通过。

0.4.0：训练卡优先展示，新增自由训练和跟计划练入口；实时训练计时及可配置的持久化组间休息倒计时。

## 0.6.2 首页精简

安装包 `dist/NextStep-0.6.2.apk`，versionCode=16，沿用原包名、来源和签名，可覆盖安装。首页七天步数与说明默认折叠，今日缺失时标记最新数据日期。读取逻辑仍包含今日及最近七天，没有新增健康权限或后台同步。已构建并通过 APK 结构、资源对齐和 v2/v3 签名校验；尚未真机验证近期缺失数据的来源。0.6.2 发布资产包含 APK、SHA256 和 update.json，应用通过 GitHub 最新正式版本检查更新。

## 0.6.3 启动检查更新

安装包 `dist/NextStep-0.6.3.apk`，versionCode=17。默认更新源继续绑定当前 Git 远端 tyrantqiao/nextStep 的 GitHub Releases。自动检查开启时，每次进程冷启动检查一次，返回前台仍按 12 小时间隔节流；关闭自动检查后不发起启动检查。发现新版及下载完成分别提示设置中的应用更新入口，离线失败不阻止使用。系统保留进程时再次打开属于返回前台，不算冷启动。沿用原包名、签名和本地来源。

0.6.3 验证：47 项 Node 回归测试、25 项 JVM 更新策略检查通过；APK 已通过资源结构、对齐和 v2/v3 签名校验。生成了对应 update.json，尚未发布 v0.6.3 Release，尚未真机验证启动联网与提示。

## 0.6.4 训练日志图标

安装包 `dist/NextStep-0.6.4.apk`，versionCode=18。采用训练日志、哑铃与完成标记组成的新应用图标，深蓝底配米白及橙色。包含 0.6.3 的冷启动检查更新与新版提示改动；沿用原包名、签名和本地来源，支持保留数据覆盖升级。图标原稿位于 `src/res/drawable-nodpi/ic_training_journal.png`，由内置 ImageGen 生成，设计提示为：训练日志卡片结合哑铃与完成对勾，深蓝、米白与活力橙，无文字。

尚未进行安卓真机图标与覆盖升级验证。

0.6.4 验证：47 项 Node 回归测试、25 项 JVM 更新策略检查通过；APK 已通过资源结构、四字节对齐和 v2/v3 签名校验，资源信息确认启动图标为新训练日志图标。已生成对应 update.json；Git 推送不等于发布 GitHub Release，应用内更新需另行上传发布资产。

## 0.6.5 训练交互修复

安装包 `dist/NextStep-0.6.5.apk`，versionCode=19。修复草稿清理失败后的重复续练与保存、历史编辑覆盖原始计时、无效组输入回退旧值、详情空值显示；增加准备与替换弹窗返回入口，计划日期切换保留焦点，首页显示结束待保存状态。沿用原包名、签名和本地来源，支持覆盖升级保留数据。

验证：55 项 Node 回归测试及 25 项 JVM 更新策略检查通过；APK 已通过资源结构、四字节对齐和 v2/v3 签名校验。已生成 APK、SHA256 和对应 update.json。浏览器工具因环境启动失败未完成本次窄屏及桌面验证，未进行安卓真机验证。此次构建和 Git 推送不包含 GitHub Release 发布；应用内更新需要另行上传发布资产。


## 0.6.6 完整训练与项目搜索

安装包 `dist/NextStep-0.6.6.apk`，versionCode=20。新增一次完整训练计时，力量、次数动作与跑步、游泳等运动加入同一份草稿，统一结束保存为一次训练；支持续练，分项运动时长不重复加到总时长。项目选择支持名称、部位、器械搜索、分类筛选和最近使用优先。保留自定义动作及旧数据，历史编辑支持混合训练的运动明细。

验证：69 项 Node 测试、25 项 JVM 更新策略检查通过；APK 结构、资源及 DEX 对齐、v2/v3 签名校验通过，签名证书与 0.6.5 一致。核对包内完整训练、搜索及 Android 原生导出代码。网页流程已在真实 Edge 的 320、390、1280 像素视口验证；未进行安卓真机测试。

已生成 APK、SHA256、带更新说明的 update.json，并打包 `dist/NextStep-0.6.6-release.zip`。已发布 [v0.6.6 GitHub Release](https://github.com/tyrantqiao/nextStep/releases/tag/v0.6.6) 为最新正式版；四份上传资产哈希与大小一致，公开 latest/update.json 与 APK 下载校验通过，应用内更新源可获取本版。

## 0.6.7 播放器式训练界面

安装包 `dist/NextStep-0.6.7.apk`，versionCode=21。训练主界面聚焦当前动作、组进度、重量/次数与完成本组，添加项目、替换和纠错收进「更多」。支持暂停与继续，暂停后锁定组操作并冻结休息倒计时，暂停状态与剩余时间随草稿保存。暂停画面长按 1.2 秒结束，提前松开取消；支持键盘长按。总时长仍包含暂停、休息和离开时间。

验证：72 项 Node 测试与 25 项 JVM 更新策略检查通过；APK 结构、资源及 DEX 对齐、v2/v3 签名校验通过，签名与 0.6.6 相同。真实 Edge 已检查 320/390/1280 像素的布局及暂停、刷新续练、长按结束和保存。沿用原包名与本地来源，支持覆盖升级；尚未进行安卓真机验证。

发布资产为 APK、SHA256、带更新说明的 update.json 和 release.zip，供 [v0.6.7 GitHub Release](https://github.com/tyrantqiao/nextStep/releases/tag/v0.6.7) 使用；应用更新源继续使用最新正式 Release 的 update.json。

## 0.6.8 训练工具与触控修复

安装包 `dist/NextStep-0.6.8.apk`，versionCode=22。训练「更多」改为最多四个适用入口的目录：添加项目、替换当前动作、修改上一组、训练设置。子页返回上一层，添加、替换或纠错成功后回到训练；保留暂停和休息状态。放弃草稿和撤销组完成采用独立确认，休息设置单独展示保存反馈。暂停中撤销组完成会清除已失效的冻结休息。

修复 Android 字体导入 URL 中分号造成 CSS 截断、暂停/继续按钮空白的问题。长按结束时手指滑出按钮立即取消；成功后的松手点击不再误关反馈弹窗。

验证：82 项 Node 测试和 25 项 JVM 更新策略检查通过；APK 结构、资源及 DEX 对齐、v2/v3 签名校验通过，证书与 0.6.7 相同。真实 Edge 安卓触控走查添加、替换、修改、确认/取消及结束保存，320/390/1280 像素无横向溢出；打包资源与走查资源一致。沿用原包名、本地来源和签名，支持覆盖安装保留数据。尚未进行安卓真机验证。

发布资产为 APK、SHA256、带说明的 update.json 和 release.zip；Release：[v0.6.8](https://github.com/tyrantqiao/nextStep/releases/tag/v0.6.8)。应用内更新继续使用最新正式 Release 的 update.json。整体动线见 [训练交互动线](../nextstep-web/TRAINING_FLOW.md)。
