# 实现随分数递增的难度曲线计算函数

## Why

游戏已有集中式难度常量表（`src/config/difficulty.ts` 的 `DIFFICULTY_CONFIG`），但缺少一个与类型契约对齐、可直接被管道生成/移动逻辑消费的难度曲线计算函数。现有 `computeDifficulty` / `computeDifficultyValue` 使用 5 参数 schema（`obstacleSpeed` 等），与 `difficulty.types.ts` 导出的三旋钮 schema（`pipeSpeed` / `gapHeight` / `spawnInterval`）相互矛盾，下游无法安全地按分数计算「速度 / 开口间距 / 生成间隔」，甚至会产生 `undefined` 参与运算得到 NaN。玩家需要难度随得分平滑、可预期、且不越界地提升，同时每一局都理论可通过。

## What Changes

- 新增纯函数 `calculateDifficulty(score, config?)`，返回 `{ speed, gap, interval }`，单位分别为 px/s、px、ms。
- 统一三旋钮难度配置类型：`pipeSpeed` / `gapHeight` / `spawnInterval`，每个旋钮为 `{ initial, ratePerScore, min, max }`，作为 `calculateDifficulty` 的 config 入参类型。
- 内置默认常量表作为 config 缺省时的回退，保证调用不崩溃。
- 非法 score（负数 / NaN / undefined）统一按 0 处理，不抛异常。
- 计算规则：线性变化 + 边界钳制（`speed` 向上钳制到上限、`gap` 与 `interval` 向下钳制到下限），保证平滑递增且不越界。
- 通过 barrel（`src/config/index.ts` 与 `src/index.ts`）导出函数与类型，供游戏逻辑统一引用，替代散落的魔法数字。
- 新增单元测试，覆盖边界分数、非法输入、单调性、不越界，覆盖率 ≥ 90%。

## Capabilities

### New Capabilities

- `difficulty-curve`: 基于分数与集中式难度常量表，线性计算并对结果做边界钳制，返回当前「速度 / 开口间距 / 生成间隔」的纯函数能力。

### Modified Capabilities

（无 —— `openspec/specs/` 当前为空，暂无既有 spec 需要改动。）

## Impact

- 代码：`src/config/difficulty.ts`（或新增难度曲线模块文件）、`src/config/index.ts`、`src/index.ts`、`tests/config/difficulty.test.ts`。
- 类型：`DifficultyConfig` / `DifficultyParam` 需与三旋钮 schema 对齐，消除 5 参数 schema 与 3 旋钮 schema 的自相矛盾。
- 调用方：管道移动逻辑与生成间隔定时器将消费 `{ speed, gap, interval }`，替代散落的硬编码数值。
- 依赖：无新增第三方依赖，纯 TypeScript 实现。