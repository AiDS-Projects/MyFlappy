# 代码审查 — 建立难度参数配置常量表

## 评分: 3/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'severity': 'critical', 'file': 'src/config/difficulty.ts', 'title': '文件被上一轮会话回复文本污染，无法编译', 'detail': '文件开头存在大段未注释的纯文本（"Both `difficulty.ts` and `constants.ts` contain leftover reply text..."及后续中文叙述"已修复。"等）。这些内容不是合法 TypeScript，`import`/`export` 之前出现裸文本会直接导致语法错误，整个模块无法加载。且文本自称"已修复"，但正文仍保留这段污染，自相矛盾。必须删除全部非代码文本，仅保留 `import type`、`import { MIN_GAP_HEIGHT }` 与 `DIFFICULTY_CONFIG` 定义。'}
- {'severity': 'critical', 'file': 'src/config/constants.ts', 'title': '文件被回复文本污染，无法编译', 'detail': '文件开头同样残留未注释的回复文本（"`「需要的改动」`为空，经核对当前..."等），非代码文本未被包裹在注释或字符串中，导致语法错误、模块无法编译。必须清除全部叙述性文字，仅保留四个常量定义及其文档注释。'}

## 🟡 警告（建议修复）
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': '魔法数字重复硬编码，破坏"唯一常量源"目标', 'detail': '`gapHeight` 的 `initial: 160` 与 `max: 160` 重复；`spawnInterval` 的 `initial: 1.8` 与 `max: 1.8` 重复；`pipeSpeed.max: 4.0` 为无推导来源的"反应极限"魔法数字。调整 initial 时需手动同步 max，一旦遗漏即产生漂移，与文档宣称的"调平衡只需改这一处"相悖。'}
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': 'pipeSpeed.min 与 initial 相等，min 字段为死配置', 'detail': '`pipeSpeed` 的 `min: 2.0` 与 `initial: 2.0` 相同，而该参数单调递增、永不下探，min 约束实际永不生效。文档却定义 min 为"下限"，语义误导调平衡者，以为下调 min 会改变行为。'}
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': '三个难度旋钮封顶分数不一致', 'detail': 'gapHeight 在 score≈60（(160-100)/1.0）即达 min，而 pipeSpeed 与 spawnInterval 在 score≈100 才达极限（(4.0-2.0)/0.02、(1.8-0.8)/0.01）。难度拐点不同步，中后段体验可能出现断层，建议统一封顶时机或显式注释说明该差异为有意设计。'}
- {'severity': 'warning', 'file': 'src/config/constants.ts', 'title': '"碰撞盒唯一来源"声明未与实际游戏逻辑对齐', 'detail': '文档声称碰撞盒宽高"已收敛到 BIRD_COLLISION_WIDTH/HEIGHT 唯一来源"，但本次仅审查了配置文件，无法确认游戏碰撞检测代码实际引用了这些常量。若游戏逻辑仍写死 40×40，则 MIN_GAP_HEIGHT 的推导并未真正与运行时联动，"理论可通过"下限仍是纸面保证。'}
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': '绕过 barrel 直接导入 constants，存在双引用路径', 'detail': '`difficulty.ts` 直接 `import { MIN_GAP_HEIGHT } from "./constants"`，而对外统一出口是 `./config`（index.ts）。同一模块出现两条导入路径，后续重构 constants 文件位置或重命名导出时容易出现遗漏，建议统一走 barrel 或明确内部直连约定。'}

## 🟢 建议（可选优化）
- {'severity': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': '补充运行时/单测不变量校验', 'detail': '为 DIFFICULTY_CONFIG 增加约束断言（如每个旋钮满足 min <= initial <= max、MIN_GAP_HEIGHT === BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2），或以单测锁定，防止未来调平衡时误写 min > max 等非法配置。'}
- {'severity': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': 'ratePerScore 缺少设计依据注释', 'detail': '0.02 / -1.0 / -0.01 三个速率值为魔法数字，未说明"到达 max/min 所需分数"这类推导依据，建议补充 why 级注释，便于后续调平衡判断改动影响。'}
- {'severity': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': '用类型工具替代手写 Object.freeze 的脆弱性', 'detail': '当前依赖手动对每个嵌套对象调用 Object.freeze，未来新增字段时易漏冻结。建议用 `satisfies DifficultyConfig` 配合 `DeepReadonly` 或 `as const`，让类型系统与运行时冻结保持一致。'}
- {'severity': 'suggestion', 'file': 'src/config/constants.ts', 'title': '常量未用 as const 标注字面量类型', 'detail': 'BIRD_COLLISION_WIDTH/HEIGHT 等推导为宽泛 `number`，调用方拿不到字面量类型信息。虽 `const` 已防重赋值，但 `as const` 可提供更精确的编译期类型。'}

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
