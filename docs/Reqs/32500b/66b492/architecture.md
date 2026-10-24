# 架构设计 - 集成难度曲线到游戏循环并实现重开重置

## 架构模式
stateful-runtime-adapter（有状态运行时适配层 + 纯函数难度核心，增量接入不推翻现有计算模块）

## 技术栈

- **language**: TypeScript
- **runtime**: 前端游戏循环（requestAnimationFrame 主循环）
- **module_system**: ES Modules（沿用现有 @/config 别名导入）
- **state_management**: 局部运行时状态（难度运行时实例，随游戏会话生命周期）
- **existing_deps**: src/config/difficulty.ts 的 calculateDifficulty 纯函数、src/config/constants.ts 物理常量、src/config/index.ts 统一出口

## 模块设计

### DifficultyRuntime
职责: 难度曲线运行时适配层：持有当前 score，缓存 DifficultyResult，向游戏主循环暴露实时 speed/gap/interval，提供 reset 复位入口。不改动 calculateDifficulty 纯函数本体。

### PipeSpawner 接入
职责: 管道生成器消费 DifficultyRuntime.getInterval() 与 getGap()：生成计时器阈值取自实时 interval，生成管道对时开口间距取自实时 gap。

### PipeMover 接入
职责: 管道移动每帧位移量取自 DifficultyRuntime.getSpeed()，替代硬编码速度常量。

### ScoreHub 联动
职责: 玩家通过管道得分时调用 difficultyRuntime.update(score)，作为难度曲线的唯一数据源，保证「分数 → 难度」单一事实来源。

### GameSession 复位流
职责: 死亡后「再来一局」：重置 score 为 0，调用 difficultyRuntime.reset()，清空管道数组，重新进入初始难度。

### config 出口扩展
职责: 如需对外统一导出运行时相关类型，补充 re-export，保持既有导入约定不变。

## 关键决策
- 难度以「分数」为唯一输入而非时间累积：保证确定性与可复位性，死亡重开只需 score 归 0 即回初始难度，无需复杂状态回滚。
- 采用「运行时适配层 + 缓存」而非每帧调用纯函数：仅在 score 变化时重算 DifficultyResult，避免 rAF 每帧重复计算的无谓开销。
- 生成间隔采用「累加 delta 与动态阈值比较」而非固定 setInterval：interval 随分数缩短时下一帧即时生效，且重开重置计时器不产生漂移。
- 不改动 calculateDifficulty 与 DIFFICULTY_CONFIG 纯函数/常量表：集成层增量叠加，既有两个工单的产出保持不变，降低回归风险。
- 速度/间距/间隔的钳制与最小间距保障完全依赖既有 clamp 与 MIN_GAP_HEIGHT：集成层不重复实现边界逻辑，杜绝魔法数字漂移。
