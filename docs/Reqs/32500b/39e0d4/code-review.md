# 代码审查 — 建立难度参数配置常量表

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'title': '源码文件疑似仍混入非代码叙述文本，可能导致编译失败', 'location': 'src/config/difficulty.ts:1, src/config/constants.ts:1', 'detail': '两个文件提交的内容开头夹带了「已修复。两个文件此前都被误写入了上一轮会话的回复文本…」「「需要的改动」部分为空…」等中文叙述段落，而非纯 TypeScript 源码。若这些叙述文本实际残留在 .ts 文件中，TS 编译器将直接报语法错误。需用 grep 或直接读盘确认磁盘文件已彻底剔除这些文字，仅保留 import/export 与常量本体。'}
- {'title': 'min/max 边界只有声明、无钳制执行，会复现「物理不可通过」bug', 'location': 'src/config/difficulty.ts:20-45', 'detail': '三个旋钮的 ratePerScore 均为线性无界外推，但本文件只声明了 min/max，未提供任何 clamp/curve 函数。一旦后续难度曲线计算模块按 `initial + ratePerScore * score` 直接实现而不做钳制：score>60 时 gapHeight 跌破 MIN_GAP_HEIGHT（100），管道开口物理上无法通过；score>100 时 pipeSpeed>4.0、spawnInterval<0.8（反应时间不足）。这正好复现 constants.ts 注释里声称要消除的「封顶后不可通过」问题——min/max 只被文档化，未被强制执行。'}

## 🟡 警告（建议修复）
- {'title': '魔法数值缺乏 why 级推导注释', 'location': 'src/config/difficulty.ts:22-45', 'detail': 'pipeSpeed.max: 4.0（为何 4.0 是反应极限）、spawnInterval.min: 0.8（为何 0.8s 是反应下限）、gapHeight.ratePerScore: -1.0、spawnInterval.ratePerScore: -0.01 均无推导依据。文件顶部声称「调平衡只需改这一处」，但缺少 why 注释会导致后续调平衡者无法判断这些数值的合理性与边界。'}
- {'title': 'initial 与 min/max 边界值重复硬编码，存在漂移风险', 'location': 'src/config/difficulty.ts:23-44', 'detail': 'pipeSpeed.min 与 initial 同为 2.0、gapHeight.max 与 initial 同为 160、spawnInterval.max 与 initial 同为 1.8，均为重复字面量。修改 initial 时需人工同步改 min/max，违背「唯一常量源」的初衷，与 constants.ts 消除魔法数字漂移的目标自相矛盾。'}
- {'title': 'src/index.ts 未 re-export 物理边界常量，破坏统一入口', 'location': 'src/index.ts:1-17', 'detail': 'src/index.ts 仅 re-export 了 DIFFICULTY_CONFIG 和类型，未导出 BIRD_COLLISION_WIDTH/HEIGHT、GAP_SAFE_MARGIN、MIN_GAP_HEIGHT。而文件注释声称「游戏逻辑统一 import from src/index」，但统一入口拿不到物理边界常量，下游被迫走 config 内部路径，注释与实际行为不一致。'}
- {'title': '数值精度风格不一致', 'location': 'src/config/difficulty.ts:31', 'detail': 'gapHeight.ratePerScore 写作 -1.0（实为整数值却用浮点字面量），与 0.02、-0.01 的浮点风格混用，可读性差。'}
- {'title': 'GAP_SAFE_MARGIN 对称假设无说明', 'location': 'src/config/constants.ts:20', 'detail': '上下两侧安全边距统一取 30 的对称假设未说明依据：小鸟是否垂直居中于开口、是否需要上下不对称边距均无文档，MIN_GAP_HEIGHT = height + margin*2 的正确性依赖此未声明假设。'}

## 🟢 建议（可选优化）
- {'title': '用 `as const satisfies DifficultyConfig` 替代类型注解', 'location': 'src/config/difficulty.ts:20', 'detail': '当前 `Object.freeze({...}): DifficultyConfig` 注解会吞掉字面量具体值类型。改用 `Object.freeze({...} as const satisfies DifficultyConfig)` 可保留字面量类型同时保证结构校验，后续若需要 `typeof DIFFICULTY_CONFIG.pipeSpeed.min` 这类精确类型更友好。'}
- {'title': '在常量文件内提供钳制/取值纯函数', 'location': 'src/config/difficulty.ts', 'detail': '建议补充 `clampParam(value, min, max)` 或 `getDifficultyAt(score): {pipeSpeed, gapHeight, spawnInterval}` 纯函数，把 min/max 钳制与常量放在同一文件，避免「常量已集中、钳制逻辑散落别处」再次产生魔法数字。'}
- {'title': '补充单元测试覆盖关键不变量', 'location': 'tests（未提供）', 'detail': '建议覆盖：MIN_GAP_HEIGHT 推导正确性（40 + 30*2 === 100）、DIFFICULTY_CONFIG 及嵌套对象 Object.isFrozen === true、三旋钮 min <= initial <= max 不变量、以及 clamp 后 gapHeight 永不低于 MIN_GAP_HEIGHT。'}
- {'title': 'ratePerScore 命名可更精确', 'location': 'src/config/difficulty.types.ts:15', 'detail': 'ratePerScore 本质是线性斜率，且未定义超出范围后如何截断。建议更名 slopePerScore 或补充文档说明线性模型在 score 越界时的钳制语义，避免与 min/max 的边界语义割裂。'}

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
