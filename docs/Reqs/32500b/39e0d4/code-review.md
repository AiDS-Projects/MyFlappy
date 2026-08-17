# 代码审查 — 建立难度参数配置常量表

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- gapHeight.min=100 被注释为「鸟碰撞盒+安全边距理论可通过下限」，但该值未引用任何小鸟碰撞盒尺寸常量，属于硬编码断言。一旦实际碰撞盒高度+安全边距超过 100px，难度封顶后管道开口将物理上无法通过，游戏变得不可继续（游戏性致命缺陷）。应改为引用 BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN 常量计算 min，杜绝两处魔法数字漂移导致的不一致。

## 🟡 警告（建议修复）
- 缺少配置不变量校验：initial 未强制落在 [min, max] 区间内、min < max 未断言、ratePerScore 符号与旋转方向未约束。Object.freeze 只防重新赋值，不防逻辑上非法的配置值，未来调平衡时写入 initial>max 或 min>max 会静默产生非法难度曲线。建议加运行时 assert 或单元测试兜底。
- 三个旋钮到达极限的分数不同步：pipeSpeed 与 spawnInterval 在 score=100 时封顶，gapHeight 在 score=60 即触底（(160-100)/1.0=60），难度曲线提前 40 分进入平台期，且缺少 MAX_SCORE/DIFFICULTY_CAP 常量显式说明。调平衡者容易忽略难度实际上限不一致的事实。
- Object.freeze 逐层手动冻结易遗漏：当前结构只有两层尚可控，一旦未来给 DifficultyParam 增加嵌套对象（如曲线分段数组），极易忘记对新层调用 freeze，产生虚假的运行时不可变保证。建议统一用深冻结工具函数，或改用 as const + satisfies DifficultyConfig 获得编译期完整只读保护。
- 魔法数值 2.0/0.02/4.0/-1.0/-0.01/160/100/1.8/0.8 虽有行内注释，但缺少与设计文档或数值来源的追溯链接，后续调平衡无法判断这些数字的推导依据（例如反应极限 4.0 px/s、最小生成间隔 0.8s 的来源）。

## 🟢 建议（可选优化）
- DifficultyParam 的 min/max 注释语义在三个旋钮上不一致：max 对 pipeSpeed 是「反应极限」，对 gapHeight/spawnInterval 却等于 initial（实际含义为「初始即上限」），而真正有效边界是 min。隐式约定（靠 ratePerScore 正负号推断方向）易被误读，建议显式引入方向字段（如 direction: 'increase'|'decrease'）或拆分 up/down 边界字段。
- 补充单元测试覆盖不变量：initial∈[min,max]、min<max、ratePerScore 与 direction 一致（pipeSpeed>0、gapHeight/spawnInterval<0）、封顶分数计算正确（100/60/100）。符合全局准则「新增逻辑要有对应测试」。
- ratePerScore 的三处单位未在类型注释中统一标注：pipeSpeed 为 px/s 每分、gapHeight 为 px 每分、spawnInterval 为 s 每分，建议在 DifficultyParam.ratePerScore 的 doc 里补一句「单位 = 该旋钮单位 / 分」，避免调用方换算出错。
- index.ts barrel 中 export 与 export type 分列写法可读性好，但可考虑 export type * 简化类型重导出（需 TS≥5.0），减少未来新增类型时遗漏重导出的风险。

## 审查的代码
- src/config/difficulty.types.ts
- src/config/difficulty.ts
- src/config/index.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
