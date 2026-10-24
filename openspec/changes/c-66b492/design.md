# 技术设计 — 难度曲线接入游戏循环与重开重置

## Context

上一变更（c-12db8a）已交付纯函数 `calculateDifficulty(score)` 与配置常量表 `DIFFICULTY_CONFIG`，通过 `src/index.ts` 统一导出。但当前 `src/` 仅有 config 模块，尚无游戏主循环、管道生成/移动、得分与游戏状态模块，难度曲线处于「可计算但未被消费」状态。

本变更在 `src/` 新增游戏循环侧模块，将难度曲线接入运行时：主循环每帧按当前得分刷新难度三元组，管道生成器与移动逻辑消费实时值；并在死亡重开时归零得分、重置难度。PRD 明确本工单为「纯逻辑集成」，不新增美术/音频资源，不引入第三方依赖。

## Goals / Non-Goals

**Goals:**

- 建立游戏主循环难度状态：单一持有当前得分与当前难度三元组，每帧刷新。
- 管道生成器消费实时 `interval` 调度生成、用实时 `gap` 决定开口间距；管道移动消费实时 `speed`。
- 死亡重开：得分归零、难度重置为初始值，重开第一帧即恢复到与 score=0 一致。
- 全部难度参数来自 `DIFFICULTY_CONFIG`，循环内零魔法数字；难度计算确定性（同分同值，误差 0）。

**Non-Goals:**

- 不新增多种障碍物、道具系统、可视化调参面板、最高分/排行榜持久化。
- 不实现暂停/继续的难度冻结逻辑（PRD 边界条件声明，若已有暂停则难度冻结）。
- 不做难度数值调优与最终平衡值确定（以配置表为准）。
- 不新增第三方依赖，不引入随机波动。

## Decisions

### 1. 难度状态集中到游戏状态对象

新增游戏状态类型（如 `GameState`），集中持有 `score` 与由 `calculateDifficulty(score)` 派生的 `difficulty: { speed, gap, interval }`。主循环每次更新调用一次 `calculateDifficulty(score)` 刷新，结果作为该帧唯一难度事实来源，生成器与移动逻辑只读此状态，避免多处重复计算产生不一致。

- 备选：生成器与移动逻辑各自调用 `calculateDifficulty`。被否——多处调用易因取分时机不同而错位（生成间隔用旧分、移动用新分），且难保证同帧一致性。

### 2. 难度刷新时机：每帧 update，而非仅在得分变化时

主循环 update 每帧刷新难度，即使得分未变也保持 `difficulty` 字段为最新派生值。成本极低（一次乘加 + 钳制），换取「任意时刻读取即当前值」的简单心智模型。

- 备选：仅得分 +1 时刷新。被否——生成器按 `interval` 计时，若难度对象不随帧刷新，重开后首帧初始值语义会变模糊，需额外重置逻辑。

### 3. 生成调度：累计计时器对比实时 interval

生成器维护 `elapsedSinceSpawn` 累计计时（`dt` 累加），当 `elapsedSinceSpawn >= difficulty.interval` 时生成一组管道并重置计时器。`interval` 随难度实时变化，下一组生成时机自动缩短，无需预计算队列。

- 备选：预计算下一次绝对生成时间戳。被否——interval 随得分实时变化，绝对时间戳需在每次难度变化时重算，累计计时器更简洁。

### 4. 管道移动与生成消费同一 `difficulty` 快照

移动逻辑：`x -= difficulty.speed * dt`；生成逻辑：开口间距 `gap = difficulty.gap`、调度用 `difficulty.interval`。三者均取自同帧 `GameState.difficulty`，保证同帧一致。

### 5. 重开重置：得分归零 + 难度派生值自然复位

`restart()` 仅需将 `score` 置 0 并清空管道/计时器，下一帧 update 调用 `calculateDifficulty(0)` 即自然得到初始难度三元组，无需手写「恢复初始值」分支。保证「重开第一帧 = score 0 = 初始难度」的强一致，杜绝重置漏改某一旋钮。

- 备选：`restart()` 手动把三个旋钮写回 `DIFFICULTY_CONFIG` 的 `initial`。被否——派生值与得分双源，若未来新增旋钮会漏改。以「得分是唯一状态、难度是派生值」消除这类漂移。

### 6. 确定性保证：不引入随机

管道开口中心位置若涉及随机，仅允许在「生成位置」维度随机，绝不在速度/间距/间隔三旋钮上随机。同分同难度由 `calculateDifficulty` 纯函数保证，误差为 0。

## Risks / Trade-offs

- **[得分与难度不同步] → 缓解**：难度作为 `score` 的派生值，由 `GameState` 单点刷新，生成器/移动只读快照，杜绝双源漂移。
- **[interval 缩短导致高分段管道过密] → 缓解**：`interval` 有配置下限 800ms，`calculateDifficulty` 已钳制；调平衡走配置表，非代码。
- **[重开首帧仍残留上一局难度] → 缓解**：`restart()` 置 score=0 后，首帧 update 即覆盖 difficulty 为初始值；游戏结束态不执行移动/生成，避免残留帧。
- **[极限得分下理论可通过性] → 缓解**：`gap.min = MIN_GAP_HEIGHT`（碰撞盒高 + 上下余量）已由 constants 推导，`calculateDifficulty` 保证 gap ≥ 110；speed 上限 340 由反应极限钳制。
- **[单位混用（s/ms）] → 缓解**：`interval` 统一 ms、`speed` 统一 px/s，移动位移按 `speed * dt`（dt 秒）计算；生成计时 `dt` 同样换算为 ms 累加，代码注释与类型 JSDoc 标注单位。

## Migration Plan

1. 在 `src/game/` 新增游戏状态、主循环、管道生成器、管道移动模块，并新增 barrel（`src/game/index.ts`）导出。
2. 从 `src/index.ts` 导出游戏侧 API，消费方统一 `import { GameState, ... } from '@/game'`。
3. 新增单元测试覆盖：帧刷新难度、生成调度、移动速度、重开重置、确定性、无魔法数字（可静态断言）。
4. 运行 `bun test` 全量通过，难度相关覆盖率 ≥ 90%。

无运行时部署/回滚复杂度——纯 TypeScript 模块，回滚即回退新增文件与导出改动。

## Open Questions

- 游戏主循环驱动方式（`requestAnimationFrame` 自驱动 vs 测试友好的手动 `step(dt)` 注入）：倾向暴露 `step(dt)` 纯逻辑入口便于确定性单测，渲染循环仅作薄封装——待实现时确认。
- 管道开口中心随机范围是否需要纳入本工单测试契约，或仅保证「生成位置随机、难度三旋钮不随机」这一边界即可。