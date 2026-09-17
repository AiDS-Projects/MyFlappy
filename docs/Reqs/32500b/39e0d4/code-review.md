# 代码审查 — 建立难度参数配置常量表

## 评分: 2/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'severity': 'critical', 'file': 'src/config/constants.ts', 'line': 1, 'title': '第 1 行为上一轮会话遗留的回复文本，非合法 TypeScript', 'detail': "文件以英文自然语言开头（'I now understand the full situation... Let me fix the file.'），随后又混入中文回复文本（'`src/config/constants.ts` 已修复...'、'修改后的完整文件内容如下：'）。这些均非代码，TypeScript 解析器会在第 1 行报 'Expected \\';\\''，导致 `bun test` 与构建失败。声称'已修复'的文件实际仍是污染状态。"}
- {'severity': 'critical', 'file': 'src/config/difficulty.ts', 'line': 1, 'title': '文件内容仅为中文回复描述，缺失实际的 DIFFICULTY_CONFIG 常量定义', 'detail': "difficulty.ts 的完整内容只是'已恢复...'等叙述性文字，没有任何 `export const DIFFICULTY_CONFIG` 及其三个难度旋钮（pipeSpeed/gapHeight/spawnInterval）的实际数值。而 src/config/index.ts 执行 `export { DIFFICULTY_CONFIG } from './difficulty'`，因该模块无此导出，编译必然报错，模块链整体断裂。"}
- {'severity': 'critical', 'file': 'src/config/index.ts', 'line': 1, 'title': 'barrel 再导出指向不存在的导出，导致导入失败', 'detail': "`export { DIFFICULTY_CONFIG } from './difficulty'` 依赖 difficulty.ts 中并不存在的导出（见上一条），上游任何 `import { DIFFICULTY_CONFIG } from '@/config'` 或从 src/index 的导入都会直接编译失败。这是由 difficulty.ts 污染连锁引发的崩溃点。"}

## 🟡 警告（建议修复）
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'line': None, 'title': 'DIFFICULTY_CONFIG 实际数值缺失，gapHeight.min === MIN_GAP_HEIGHT 无法验证', 'detail': '本次评审范围中未出现任何 DIFFICULTY_CONFIG 的真实数值，无法确认 gapHeight.min 是否已引用 MIN_GAP_HEIGHT（=100）。若仍写死为 100 而未改为引用导出，则本次重构的核心目标（消除魔法数字漂移）未被达成，MIN_GAP_HEIGHT 的推导毫无意义。'}
- {'severity': 'warning', 'file': 'src/config/constants.ts', 'line': None, 'title': "'唯一源' 仅为声明，游戏逻辑未迁移到常量引用", 'detail': "注释声称 BIRD_COLLISION_WIDTH/HEIGHT 是碰撞盒尺寸'唯一来源'，但原动机正是这些数值'散落在游戏逻辑多处'。本次仅交付常量表，未见游戏逻辑侧改为引用这些导出的改动，因此'唯一源'目前是纸面约定而非强约束，漂移风险依旧存在。"}
- {'severity': 'warning', 'file': 'src/index.ts', 'line': None, 'title': '根 barrel 未再导出物理边界常量，下游可能重新写死碰撞尺寸', 'detail': "src/config/index.ts 导出了 BIRD_COLLISION_WIDTH/HEIGHT/GAP_SAFE_MARGIN/MIN_GAP_HEIGHT，但根入口 src/index.ts 仅再导出 DIFFICULTY_CONFIG 与类型。按'统一从 src/index 引用'的约定，消费方拿不到这些常量，易退回写死数值，与去魔法数字的目标相悖。"}
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'line': None, 'title': 'Object.freeze 仅浅冻结，且嵌套冻结声明不可验证', 'detail': "描述称'顶层与嵌套对象均用 Object.freeze 冻结'，但 Object.freeze 只做浅冻结；若嵌套 DifficultyParam 未单独 freeze，其内部字段仍可被改写。由于真实代码缺失，既无法确认嵌套是否已 freeze，也无法确认类型注解是否补齐 readonly 约束。"}

## 🟢 建议（可选优化）
- {'severity': 'suggestion', 'file': 'src/config/difficulty.types.ts', 'line': None, 'title': 'min 字段注释混淆 gapHeight 与 spawnInterval 语义', 'detail': "min 被统一描述为'理论可通过的最小值'，但该表述仅适用于 gapHeight。对 spawnInterval，min 语义应是'最短生成间隔（反应极限）'，而非'可通过'。建议按字段分别说明，避免调平衡时误读。"}
- {'severity': 'suggestion', 'file': 'src/config/difficulty.ts', 'line': None, 'title': '建议使用 `satisfies DifficultyConfig` 标注常量', 'detail': 'DIFFICULTY_CONFIG 若采用 `as const` + `satisfies DifficultyConfig`，可保留字面量类型并让编译器校验结构与 DifficultyConfig 完全一致，防止字段遗漏或类型漂移，优于仅靠运行时 Object.freeze。'}
- {'severity': 'suggestion', 'file': None, 'line': None, 'title': '缺少防漂移回归测试', 'detail': "本次重构针对的正是'gapHeight.min 与碰撞盒尺寸漂移'类 bug，应新增断言 `DIFFICULTY_CONFIG.gapHeight.min === MIN_GAP_HEIGHT` 及 MIN_GAP_HEIGHT 推导关系的单元测试，防止后续有人重新写死 100。"}
- {'severity': 'suggestion', 'file': None, 'line': None, 'title': '缺少防止回复文本污染入库的门禁', 'detail': '两个文件均被上一轮会话回复文本污染，说明提交前没有 lint/typecheck（如 `bun test` 或 tsc --noEmit）作为合并门禁拦截。建议在 CI/提交钩子中强制运行类型检查，避免此类污染再次入库。'}

## 审查的代码
- src/config/constants.ts
- src/config/difficulty.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
