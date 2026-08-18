# 代码审查 — 建立难度参数配置常量表

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- src/config/difficulty.ts 文件内容仍以非代码叙述文本开头（"All three files in this deliverable are corrupted by the same bug: ... Let me restore them.问题已定位并修复。... 修改后的 `src/config/difficulty.ts` 完整内容如下："），这些英文/中文叙述位于 import 语句之前，属于非法 TypeScript 语法，文件无法通过编译。声称的"已恢复"并未真正落实到文件——上一轮的'回复文本误写入文件'问题仍然存在。
- src/config/constants.ts 同样在代码之前混入大段中文叙述文本（"`需要的改动` 部分为空，没有可执行的增量改动。经核对..."），属于非法 TypeScript，文件无法编译。交付物仍处于损坏状态。

## 🟡 警告（建议修复）
- 根入口 src/index.ts 未 re-export 物理边界常量（BIRD_COLLISION_WIDTH / BIRD_COLLISION_HEIGHT / GAP_SAFE_MARGIN / MIN_GAP_HEIGHT），仅导出了 DIFFICULTY_CONFIG 与两个类型；而 config/index.ts 已导出这些常量。文档声称提供'统一引用入口'，但从项目根 `import { MIN_GAP_HEIGHT } from "src/index"` 会失败，与模块意图不一致。
- 难度曲线参数均为无来源的魔法数字（2.0 / 4.0 / 0.02 / 160 / -1.0 / 1.8 / 0.8 / -0.01）。文档注释声称 max 对应'反应极限'、min 保证'足够反应时间'，但没有任何推导、测量或引用支撑这些具体取值，后续调平衡无法判断其合理性。
- 三个旋钮到达上/下限所需的分数不一致：gapHeight 每分收窄 1.0px，从 160 到 100 仅需约 60 分即触底；pipeSpeed 与 spawnInterval 则需约 100 分才到极值。难度曲线各维度封顶时间点不统一，且 gapHeight.ratePerScore=-1.0（整数）与其他旋钮小数步进（0.02/-0.01）精度风格不一致。
- Object.freeze 是浅冻结，当前靠手动逐个冻结嵌套对象来补偿，新增旋钮时极易遗漏嵌套 freeze 导致运行时被改写；readonly 类型仅在编译期生效，遇到 any 断言即可绕过。readonly + 双层 freeze 的防护存在维护隐患且语义重复。

## 🟢 建议（可选优化）
- 交付物未包含任何针对配置本身的单元测试（叙述声称 'bun test 16/16 通过' 但无测试文件随附）。建议补充验证不变量（min ≤ initial ≤ max、MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2）的测试，防止配置写反或推导断裂。
- 缺少类型级或运行时校验保证 min ≤ initial ≤ max 的约束成立，一旦某个旋钮的 initial 写超出 [min, max] 范围不会产生任何编译或运行时报错。建议用 `satisfies` 加断言或在模块加载时做一次不变式校验。
- constants.ts 与 difficulty.ts 顶部注释过于冗长，读起来像 PR 描述/changelog 而非代码文档（constants.ts 大段说明'消除两类魔法数字漂移'的背景）。建议精简，只保留'为什么这么做'的 why 级注释。
- BIRD_COLLISION_WIDTH 在配置层并未被使用（仅 BIRD_COLLISION_HEIGHT 参与 MIN_GAP_HEIGHT 推导），若当前暂无消费方，建议暂缓导出或注明用途，避免把未用常量误暴露为公共 API。

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
