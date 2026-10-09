# AGENTS.md

## 项目概况

NextStep 是中文、本地优先的训练记录应用，包含浏览器版和共享网页资源的 Android WebView 壳。支持个人资料、规则生成的训练计划、逐组力量训练、草稿续练、其他运动记录、统计和 JSON 导出。数据保存在 localStorage；目前没有账户或后端同步。

本文件适用于整个仓库。开始修改前阅读相关目录的 README 和实现，以当前代码为准；README 中的历史版本说明不一定代表当前行为。保留用户已有的未提交修改，不覆盖或回滚无关文件。

## 目录与技术栈

- `nextstep-web/dist/`：实际维护并直接运行的网页源码，**不是可删除或重新生成的构建缓存**。`index.html` 为入口，`app.js` 包含业务逻辑和事件处理，`styles.css`、`home.css` 为样式。
- `nextstep-web/serve.cjs`：基于 Node.js 内置模块的静态服务器，监听 `127.0.0.1:4173`。
- `nextstep-web/tests/journal.test.cjs`：使用 `node:test`、`assert` 和 `vm` 的业务回归测试；模拟 DOM 和 localStorage，不能替代真实浏览器验证。
- `android-app/src/`：Manifest、Java Activity 和 Android 资源。包名为 `com.nextstep.training`，最低 Android API 为 26。
- `android-app/prepare-assets.cjs`：复制四个网页资源，移除 CSS 的外部导入并适配原生 JSON 导出。
- `android-app/build.ps1`：直接调用 Android SDK/JDK 工具完成资源编译、Java 编译、DEX、对齐、签名和校验。
- `android-app/verify-apk.cjs`：检查 APK 必需条目、ZIP 路径、DEX 及资源表对齐。

项目没有 `package.json`、npm 依赖安装步骤或 Gradle 工程。沿用原生 JavaScript、CommonJS 工具脚本、Java 和 PowerShell；除非任务需要，不引入框架或新的构建体系。

## 常用命令

以下命令均在仓库根目录执行：

```powershell
# 启动网页，访问 http://127.0.0.1:4173
node nextstep-web/serve.cjs

# JavaScript 语法检查
node --check nextstep-web/dist/app.js

# 业务回归测试
node --test nextstep-web/tests/journal.test.cjs

# 构建并验证安卓 APK
./android-app/build.ps1
```

Android 构建需要 Node.js、JDK、Android Platform 35 和对应 Build-Tools。默认路径见 `build.ps1`，可通过 `-JdkPath`、`-BuildToolsPath`、`-PlatformPath` 指定本机路径；依赖缺失时明确报告，不虚报构建成功。构建输出位于 `android-app/dist/`，中间文件位于 `android-app/build/`。

## 实现约定

- 用户界面和文案使用中文，保持现有视觉风格与移动端操作流程。修改集中在任务相关函数和样式，避免顺带格式化整个 `app.js`。
- 沿用现有 `data-*` 属性、事件委托和页面导航方式；保留旧 `#trends` 链接的兼容行为。
- 用户输入、历史记录等动态文本插入 HTML 前使用现有转义方法；数值输入需校验有限值、范围和整数要求。
- 沿用现有 localStorage 键和数据结构。变更数据结构时兼容旧资料、记录和草稿，不通过清空用户数据解决迁移问题。
- 保存失败应保留可重试状态；完成组、结束训练和保存记录的状态推进需遵守现有持久化成功条件。重复完成同一组不能重复计时或追加记录。
- 训练时长根据实际开始、结束时间计算，包含组间休息与关闭窗口期间的连续时间；结束反馈用时不计入。休息截止时间随草稿持久化。
- 日期统计使用设备本地日期，周一为每周起点。调整统计或记录编辑时，同步检查时长、组数、吨位、日历和首页汇总。
- 力量训练吨位仅统计已完成的负重组，按重量 × 次数计算。哑铃重量按单只记录，不自动乘二；次数训练使用 `type: 'bodyweight'`、`weight: null`，不计外部负重吨位。负重完成组需大于 0 kg。
- 运动热量沿用 MET × kg × 小时的估算，并保留活动代码、MET、体重和公式等记录信息。清楚说明为含静息消耗的估算；新增或修改 MET 数据时核实来源。
- 新安装不注入个人资料、测试记录或预设计划；不要将规则模板、试练参考重量或热量估算描述为个性化测量结果。

## 网页与 Android 的联动

- 网页改动通过 `prepare-assets.cjs` 打包进 APK；不要手工修改构建目录中的网页副本。新增网页资源时同步更新打包和校验逻辑。
- Android 导出使用 `window.NextStepAndroid.exportRecords`。适配脚本依赖 `app.js` 中的精确标记 `case 'export':{const url=`；修改导出代码时同步更新适配器，确保浏览器下载和 Android 导出均可用。
- 保持 Android 本地 HTTPS 来源 `https://app.nextstep.local` 和 localStorage 的连续性。修改来源、包名或签名会影响已有用户的数据访问或覆盖升级，需在任务中明确处理。
- 维持离线运行，不随意增加网络权限、远程依赖或扩大 JavaScript 原生桥接范围。
- 不提交或分发 `android-app/signing/` 中的签名私钥、SDK 工具和构建中间文件。保留已有签名材料以支持覆盖升级。
- 发布版本时同步检查 Manifest 的 `versionCode`/`versionName`、构建脚本的 APK 文件名和校验文件名、相关 README。网页更新后，只有重新构建的 APK 才包含改动。

## 验证与交付

- 文档修改检查内容与实际文件、命令一致；无需为纯文档修改重建 APK。
- 网页业务修改运行语法检查和相关回归测试；新增测试应覆盖实际行为、数据兼容或失败路径。
- UI 修改在真实浏览器检查相关页面、表单、弹窗和训练流程，覆盖窄屏（至少 320、390 像素）和桌面视口。检查整页横向溢出、局部表格滚动、焦点和统计切换后的滚动位置。
- 涉及网页打包、原生代码或 APK 交付时运行 Android 构建及其内置校验。自动检查和浏览器验证不能宣称为安卓真机测试。
- 完成后简要说明修改、已执行的验证及未验证部分；只有实际生成并校验过安装包时才报告 APK 构建成功。

## 用户交互偏好（2026-10-10）

- 用户明确不喜欢展开/收起的抽屉式交互（包括 details/summary），后续新页面或重设计应使用清晰的并列切换或独立步骤，不再堆叠可折叠区。
- 减少同屏元素和重复入口。选择项目与填写训练参数分步呈现，常练与搜索并列切换；优先让手机用户快速决策，保留返回及已填数据。
