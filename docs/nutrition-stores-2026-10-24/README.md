# 独立店铺菜单与食品热量补齐

本次更新网页，未重建APK。

## 选餐流程

「店铺 / 常吃 / 搜索」并列，新增餐食默认店铺页。先选店铺，再进入该店独立菜单；支持店铺及店内搜索、连续加购、跨店购物车、前置份量选择和摘要确认。显示的是应用已收录参考菜品，餐饮类型使用专区；不是实时门店目录或完整在线菜单。

返回保留店铺搜索词和已选食品，刷新续填恢复店铺、关键词、购物车及份量。旧版 `browse: restaurant` 下拉选店草稿兼容为独立菜单；原食品快照保持。

## 热量口径

135项内置食品全部有有限且非负热量，补齐原缺失17项；只更改食品目录，历史餐食、草稿和收藏的食品快照维持原值。用户自定义未知热量仍可留空，不计作零。完整逐项审计见 [catalog-energy-audit.json](catalog-energy-audit.json)，17项补充的来源、分项配方及规格见 [filled-energy-references.json](filled-energy-references.json)。

食品数据版本 `2026-10-24.1`，本次核查日期2026-10-24。仅合计时四舍五入显示，kJ按除以4.184换算kcal。

| 食品 | 参考量 | 热量 | 来源口径 |
| --- | --- | ---: | --- |
| 巨无霸 | 1个 | 2146kJ，约513kcal | 麦当劳大陆官网 |
| 麦香鸡 | 1个 | 1546kJ，约370kcal | 麦当劳大陆官网 |
| 板烧鸡腿堡 | 1个 | 1638kJ，约391kcal | 官网2025-04营养表，未混用旧介绍399kcal |
| 麦当劳薯条小 / 中 / 大 | 每份 | 877 / 1210 / 1587kJ | 迷你444kJ不作小份，不含额外蘸酱 |
| 麦乐鸡 | 5块 | 215kcal | 大陆官网当家产品介绍，不含蘸酱 |
| 无糖可口可乐 | 每100ml | 0kcal | 品牌大陆官网明确0能量，实际包装优先 |
| 无糖雪碧 | 每100ml | 0kcal | 港版官方标签参考，界面明确地区 |
| 肯德基葡式蛋挞 | 1个 | 182kcal | 台版原味52g参考，界面明确不是大陆核实值 |
| 肯德基香辣 / 烤鸡腿堡 | 1个参考 | 约534 / 425kcal | 独立面包、熟肉、油、酱料配方估算 |
| 肯德基薯条小 / 中 / 大 | 每参考份 | 约224 / 315 / 406kcal | 土豆生重150 / 210 / 270g，加吸油12 / 17 / 22g；不是门店份重，不含蘸酱 |
| 肯德基上校鸡块 | 1块参考 | 约45kcal | 熟鸡胸10g、面包屑4g、吸油2g；默认5块约226kcal |
| 含糖瓶装柠檬茶 | 每100ml | 40kcal | 假设每100ml终体积含糖10g，4kcal/g；非具体品牌标签，不适用于无糖款 |

大陆肯德基现行完整营养数据本次未核实。估算采用现有已核实USDA基础食物参考并列出假设，菜名及来源区明确标为配方估算；参考配方不代表门店实测，生/熟重量不混用。蛋挞及雪碧采用明确地区的公开参考，并未描述为大陆官方值。用户可按实际标签编辑。

## 核查来源

- [麦当劳中国：巨无霸](https://www.mcdonalds.com.cn/product/Big-Mac)、[麦香鸡](https://www.mcdonalds.com.cn/product/McChicken)、[板烧鸡腿堡](https://www.mcdonalds.com.cn/product/Grilled-Chicken-Sandwich)、[薯条](https://www.mcdonalds.com.cn/product/french-fries)、[麦乐鸡](https://www.mcdonalds.com.cn/know_your_icon/McNuggets-star-product)。各来源页给出对应规格，官网营养表说明数据更新时间2025年4月。
- [可口可乐中国品牌页](https://www.coca-cola.com/cn/zh/brands/coca-cola)：无糖款0能量；[香港无糖雪碧标签](https://www.coca-cola.com/hk/zh/brands/sprite)：每100ml为0kcal。
- [台北市食材登录平台：业者公开原味蛋挞](https://foodtracer.health.gov.taipei/UniPages/CustPageView?company_id=97161500&fid=df2a1a9a-6c79-4efd-942c-4acfcf11b659&itemno=36&mid=b9f0aa7c-8b7e-4eb0-8017-f3c0a2e93a39&pt=%E7%94%9C%E9%BB%9E%E9%A1%9E)：52g、182kcal；仅使用这两项营养事实，未转载检验报告。
- [USDA原有选定基础食物参考](../food-expansion-2026-10-15/usda-selected-references.json)：用于本次独立参考配方的面包、熟肉、生菜、土豆及酱料；油和糖沿用9 / 4kcal每克。
- [肯德基中国](https://www.kfc.com.cn/)仅用于品牌与菜名背景，不作本应用配方的官方热量来源。

## 验证

`node --check` 检查 `foods.js`、`nutrition.js`、`app.js`；234项Node回归通过，覆盖全部食品热量、官方规格与kJ换算、估算配方合计、旧未知快照、来源冻结、店铺筛选和草稿往返。

`node docs/nutrition-stores-2026-10-24/verify.cjs` 通过25项真实无头Edge检查，结果见 [results.json](results.json)。使用临时浏览器资料、随机本地服务端口和调试端口9347，数据仅作验收。检查320/390/1280像素的店铺列表与菜单，无整页或弹窗横向溢出，底部购物车可见。验证跨店加购、搜索、刷新续填、半份、来源、摘要保存和失败重试。未进行安卓真机、软键盘或覆盖升级测试。

- 店铺列表：[320](stores-320.png)、[390](stores-390.png)、[1280](stores-1280.png)。
- 麦当劳独立菜单：[320](mcdonalds-320.png)、[390](mcdonalds-390.png)、[1280](mcdonalds-1280.png)。
- [肯德基菜单](kfc-390.png)、[跨店购物车](cart-390.png)、[确认摘要](review-390.png)、[配方依据](recipe-source-390.png)。
