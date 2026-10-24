# 技术设计 — 难度曲线计算函数

## Context

上一任务（39e0d4）已在 `src/config/difficulty.ts` 建立难度常量表，但存在两类遗留问题：

1. **类型契约自相矛盾**：`difficulty.ts` 用 5 参数 schema（`obstacleSpeed` / `spawnIntervalMs` / `maxObstacles` / `hazardDamage` / `maxFallSpeed`，字段为 `rate`），而 `difficulty.types.ts` 导出的是三旋钮 schema（`pipeSpeed` / `gapHeight` / `spawnInterval`，字段为 `ratePerScore`）。下游按类型读字段会得到 `undefined`，参与运算产生 NaN（code-review 评分 4/10）。
2. **缺少可安全消费的计算函数**：`difficulty.ts` 内的 `computeDifficulty` / `computeDifficultyValue` 未通过 barrel 导出，且与三旋钮类型脱节。

本任务在此之上实现 PRD 要求的 `calculateDifficulty(score, config?)`，返回 `{ speed, gap, interval }`，供管道移动与生成逻辑直接消费。

## Goals / Non-Goals

**Goals:**

- 提供单一、纯函数、类型安全的难度曲线计算入口 `calculateDifficulty`。
- 统一三旋钮配置 schema，消除 5 参数与 3 旋钮的矛盾，恢复「单一事实来源」。
- 保证线性递增 + 边界钳制，结果单调、不越界、理论可通过。
- 非法分数归一化为 0，config 缺省回退默认表，调用永不崩溃。

**Non-Goals:**

- 不做非线性缓动（ease-in/out），本期采用线性 + 钳制。
- 不实现死亡重置、道具、多障碍物、音效/UI/可视化调参面板。
- 不引入第三方依赖。

## Decisions

### 1. 函数签名：`calculateDifficulty(score, config?)` 返回平铺三元组

返回 `{ speed, gap, interval }`（px/s、px、ms），直接对应管道移动速度、开口间距、生成间隔三个消费点，调用方零转换。

- 备选：返回 `DifficultyValues`（Record 按 key 取值）。被否——平铺字段能获得编译期完整属性检查，且与 PRD 验收标准逐字段对齐。

### 2. 统一三旋钮 schema

统一为 `DifficultyParam = { initial, ratePerScore, min, max }`，`DifficultyConfig` 含三个旋钮 `pipeSpeed` / `gapHeight` / `spawnInterval`。函数内部映射 `speed ← pipeSpeed`、`gap ← gapHeight`、`interval ← spawnInterval`。

- 备选：直接重命名字段为 `speed` / `gap` / `interval` 以消除映射。被否——保留现有 `difficulty.types.ts` 的旋钮命名可最小化对既有类型与测试的破坏；映射关系集中在 `calculateDifficulty` 内部一处，成本低。

### 3. 默认常量表以 PRD 三旋钮值为权威

内置默认表采用 PRD 数值：

| 旋钮 | initial | ratePerScore | min | max |
|------|---------|--------------|-----|-----|
| speed | 200 | +4 | 200 | 340 |
| gap | 180 | -2 | 110 | 180 |
| interval | 1600 | -20 | 800 | 1600 |

5 参数表中的 `maxObstacles` / `hazardDamage` / `maxFallSpeed` 不属于本函数三旋钮契约，移出本函数 schema（可保留供后续扩展，但不被本函数消费）。`MIN_GAP`（110）由 `constants.ts` 的 `MIN_GAP_HEIGHT`（碰撞盒高 + 上下安全余量）推导，杜绝魔法数字漂移。

- 备选：沿用现有 5 参数表数值（speed 初值 60 等）。被否——PRD 明确以 200/340/180/110/1600/800 为验收基准，且 PRD 注明「可整表微调」，以 PRD 为权威即可满足验收。

### 4. 分数归一化：`normalizeScore(score)`

`score` 为非有限数、负数或 `undefined` 时统一归一为 0；其余取 `Math.floor` 与否由消费方决定——本函数直接使用数值分数参与线性运算，不做取整（保持纯计算语义）。

### 5. 边界钳制复用 `clamp`

`speed = clamp(initial + ratePerScore * score, min, max)`；对 `gap` / `interval` 由于 `ratePerScore` 为负，同样的 `clamp` 即实现向下钳制（`max` 为初始基线，`min` 为触底下限）。统一用一处 `clamp`，避免 speed 向上、gap/interval 向下两套手写分支。

### 6. 导出与单一入口

`calculateDifficulty` 及其类型通过 `src/config/index.ts` 与 `src/index.ts` barrel 导出。游戏逻辑统一 `import { calculateDifficulty } from '@/config'`，禁止在管道/生成逻辑散落魔法数字。

## Risks / Trade-offs

- **[5 参数表与 3 旋钮表数值不一致] → 迁移**：本函数以三旋钮默认表为唯一计算事实来源；`difficulty.ts` 中的 5 参数表与 `computeDifficulty*` 不再作为对外 API，避免双表并存导致下游取值漂移。
- **[单位混用（s vs ms）] → 缓解**：`interval` 明确为 ms，类型 JSDoc 与字段命名标注单位；PRD 中 `BASE_SPAWN_INTERVAL` 单位即 ms。
- **[浮点累积误差导致单调性测试抖动] → 缓解**：单调性断言加 `+0.001` 容差；计算本身为一次乘加 + 钳制，无累积。
- **[浅冻结/运行期可改写] → 缓解**：默认表顶层与各旋钮对象均 `Object.freeze`，配 `Readonly` 类型，保证运行期不可变。

## Migration Plan

1. 在 `src/config/` 新增或改造难度曲线模块，提供默认常量表 + `normalizeScore` + `calculateDifficulty`。
2. 更新 `src/config/index.ts` 与 `src/index.ts` 导出 `calculateDifficulty` 及三旋钮类型。
3. 扩展 `tests/config/difficulty.test.ts`，覆盖 PRD 全部验收点（边界分数、非法输入、单调性、不越界、config 缺省/覆盖）。
4. 运行 `bun test` 验证，覆盖率 ≥ 90%。

无运行时部署/回滚复杂度——纯 TypeScript 函数，回滚即回退单文件改动。

## Open Questions

- 默认常量数值最终以 PRD 为准还是以项目实际画布/管道速度为基准微调（PRD 已声明可整表微调），待实现时与游戏循环参数对齐确认。
- 5 参数表（`maxObstacles` / `hazardDamage` / `maxFallSpeed`）是否在后续任务单独消费，本期是否直接删除或保留待用。