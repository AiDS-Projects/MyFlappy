# 代码审查 — 建立难度参数配置常量表

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'severity': 'critical', 'file': 'src/config/constants.ts', 'line': 1, 'title': '文件头部混入残留对话文本，非合法 TypeScript，编译必失败', 'detail': '`constants.ts` 的开头包含「I have the full picture...」「Let me write the correct file.`difficulty.ts` is also polluted...」「Both files were actually polluted...」等一整段 AI 对话残留文本，再之后才出现 `/** 物理边界常量唯一源 */`。这些英文/中文句子不是合法 TS 语句，任何 `tsc` / 打包工具在解析该文件时都会直接报语法错误，交付物不可编译。', 'fix': '删除 `export const BIRD_COLLISION_WIDTH` 之前的所有残留文本，仅保留从 JSDoc 注释开始的合法 TS 内容。'}
- {'severity': 'critical', 'file': 'src/config/difficulty.ts', 'line': 1, 'title': '文件头部混入残留对话文本，非合法 TypeScript，编译必失败', 'detail': '`difficulty.ts` 的第 1 行开始是「文件当前状态已与「原文件完整内容」一致...由于「需要的改动」为空...文件内容保持如下：」这段对话残留文本，之后才是 `import type { DifficultyConfig }`。同样不是合法 TS，会导致 `import { MIN_GAP_HEIGHT } from "./constants"` 与整体模块加载失败。', 'fix': '删除 `import type { DifficultyConfig } from "./difficulty.types";` 之前的所有残留文本，仅保留 import 与常量定义。'}

## 🟡 警告（建议修复）
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': '三个难度旋钮封顶节奏不一致，gapHeight 提前触底', 'detail': 'gapHeight: initial=160, ratePerScore=-1.0, min=100 → 在 score=60 即触底；而 pipeSpeed(initial 2.0, rate 0.02, max 4.0) 与 spawnInterval(initial 1.8, rate -0.01, min 0.8) 都要到 score=100 才封顶。这意味着 score 60 之后 gapHeight 已被锁死在最小值，中后期难度只剩「速度/生成间隔」两个旋钮在变化，难度曲线提前失活、玩法趋于单调。', 'fix': '统一三个旋钮的封顶 score（如都设为 100），或将 gapHeight 的 ratePerScore 调整为 -0.6 使其与其余旋钮同步触底；若提前封顶是有意设计，请在注释中说明理由。'}
- {'severity': 'warning', 'file': 'src/config/difficulty.types.ts', 'title': 'ratePerScore 符号约定仅靠注释，无类型/运行时约束', 'detail': 'pipeSpeed 为正步进、gapHeight 与 spawnInterval 为负步进这一关键语义只写在 JSDoc 注释里，`DifficultyParam` 类型本身无法区分「增参」与「减参」。一旦某处写反符号（例如把 gapHeight.ratePerScore 写成 +1.0），类型系统不会报警，最终表现为开口越打越开这种隐蔽逻辑错误。', 'fix': "可将 DifficultyParam 拆分为带方向语义的字段（如 `direction: 'increase' | 'decrease'`），或在难度曲线计算模块中增加符号校验断言。"}
- {'severity': 'warning', 'file': 'src/config/difficulty.ts', 'title': '浮点 ratePerScore 在长局中易累积误差', 'detail': 'ratePerScore 使用浮点（0.02 / -1.0 / -0.01），若难度曲线计算模块用 `initial + rate * score` 逐帧递推，浮点无法精确表示 0.01/0.02，长局（数千分）下会产生累积漂移。当前虽只是常量表，但作为后续计算模块的唯一数据源，需要提前声明计算方式。', 'fix': '建议在文档中明确「按 score 一次性公式计算（initial + rate*score）后再 clamp」而非逐帧递推，避免误差累积。'}

## 🟢 建议（可选优化）
- {'severity': 'suggestion', 'file': 'src/config/constants.ts', 'title': '文件名 constants.ts 过于宽泛，语义不清', 'detail': '该文件只承载「小鸟碰撞盒 + 管道开口安全边距」这类物理边界常量，命名为通用的 `constants.ts` 会让后续维护者把各类无关常量（如 UI 尺寸、音频配置）也塞进来，破坏「唯一源」边界。', 'fix': '建议改名为 `physics.ts` 或 `collision.ts`，并在 index.ts 同步调整导出。'}
- {'severity': 'suggestion', 'file': 'src/config/constants.ts', 'title': '底层常量 docstring 反向引用上层 DIFFICULTY_CONFIG，形成概念耦合', 'detail': 'constants.ts 的 docstring 中写「任何依赖物理边界的配置（如 DIFFICULTY_CONFIG.gapHeight.min）」，让底层 constants 模块「知晓」了上层 difficulty 模块的存在，形成反向依赖的心智模型。正确方向应是 difficulty.ts 单向引用 constants.ts。', 'fix': '将 docstring 改为中立表述（如「供各难度配置的 gapHeight.min 引用」），把依赖关系描述放到 difficulty.ts 一侧。'}
- {'severity': 'suggestion', 'file': 'src/config/constants.ts', 'title': 'GAP_SAFE_MARGIN 未区分上/下边距，扩展性受限', 'detail': 'MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2 隐含上下边距对称。若未来小鸟向上与向下的碰撞风险不对称（例如重力导致下落更快），需要非对称边距时，该公式和命名都要改。', 'fix': '可考虑拆为 `GAP_SAFE_MARGIN_TOP` / `GAP_SAFE_MARGIN_BOTTOM`，或至少在当前注释中说明「当前假设上下对称」。'}

## 审查的代码
- src/config/constants.ts
- src/config/difficulty.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
