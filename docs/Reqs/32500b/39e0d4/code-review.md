# 代码审查 — 建立难度参数配置常量表

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- src/config/constants.ts 交付内容自相矛盾且非合法代码：difficulty.ts 的提示称 constants.ts「仍被上一轮回复文本污染（第 1–5、39–41 行为 --- 与说明文字）」，而 constants.ts 部分又称「已修复」，且本次交付未给出 constants.ts 的实际代码正文。difficulty.ts 第 2 行 `import { MIN_GAP_HEIGHT } from "./constants"` 依赖该模块，导致 gapHeight.min 实际值未知，模块无法编译，bun test 必然失败。
- min/max 边界没有任何消费逻辑（无 clamp/计算函数，仅存数据）。ratePerScore 为线性且无约束：gapHeight 在 score 超过 (160 - MIN_GAP_HEIGHT) 后变为负数（负开口间距），spawnInterval 在 score 超过 100 后跌破 0.8 并最终转负（负生成间隔），pipeSpeed 在 score 超过 100 后突破 max 4.0。作为宣称的「唯一常量源」，边界未被执行，存在逻辑错误与负值/崩溃风险。

## 🟡 警告（建议修复）
- initial 与一侧边界值重复（pipeSpeed.min==initial==2.0、gapHeight.max==initial==160、spawnInterval.max==initial==1.8），是隐式魔数，调整 initial 时极易忘记同步对应边界，存在漂移风险。
- 三个旋钮达到极限所需分数不一致：pipeSpeed 与 spawnInterval 均为 100 分触顶，gapHeight 触底需 (160 - MIN_GAP_HEIGHT) 分，若 MIN_GAP_HEIGHT ≠ 60 则三旋钮不同步，难度曲线会出现突变点。
- spawnInterval.min=0.8s 可能低于人类反应时间（通常约 1s），pipeSpeed.max=4.0 的「反应极限」亦无数据依据，调参缺乏可追溯性。
- 缺少运行时校验 min <= initial <= max 且 min < max，错误配置会在运行时静默失败而非启动即报错。

## 🟢 建议（可选优化）
- 改用 `as const satisfies DifficultyConfig`（可叠加 Object.freeze），获得字面量类型的编译期校验，防止字段值/类型漂移。
- 新增 resolveDifficulty(score) 或 clamp 工具函数并在本模块就近导出，让 min/max 真正被消费，消除「死数据」状态。
- 显式编码变化方向（如 direction: 1 | -1 字段）替代依赖注释的符号约定，降低调用方误用风险。
- difficulty.ts 与 difficulty.types.ts 重复了单位与含义注释，建议统一收敛到类型定义一处。

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
