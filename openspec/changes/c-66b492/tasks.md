# 实施清单 — 难度曲线接入游戏循环与重开重置

## 1. 游戏状态与主循环

- [x] 1.1 新增游戏状态类型（`GameState`）：集中持有 `score` 与派生难度三元组 `difficulty: { speed, gap, interval }`
- [x] 1.2 实现主循环 `step(dt)` / update：每帧读取当前得分，调用 `calculateDifficulty(score)` 刷新 `difficulty`
- [x] 1.3 游戏状态与循环模块不硬编码任何难度数值，全部取自 `DIFFICULTY_CONFIG` / `calculateDifficulty`

## 2. 管道生成与移动

- [x] 2.1 实现管道生成器：用累计计时器对比实时 `difficulty.interval` 决定生成时机
- [x] 2.2 新生成管道开口间距使用实时 `difficulty.gap`
- [x] 2.3 实现管道移动：`x -= difficulty.speed * dt`，所有已生成/后续管道统一消费实时 `speed`
- [x] 2.4 生成器与移动逻辑只读同帧 `GameState.difficulty` 快照，保证同帧一致

## 3. 重开重置

- [x] 3.1 实现 `restart()`：得分归零、清空管道与生成计时器
- [x] 3.2 重开第一帧通过 `calculateDifficulty(0)` 自然恢复初始难度，确保 score=0 与初始难度强一致

## 4. 导出

- [x] 4.1 新增 `src/game/` barrel 导出游戏状态 / 循环 / 生成 / 移动 API
- [x] 4.2 通过 `src/index.ts` 导出游戏侧 API，消费方统一 `import { ... } from '@/game'`

## 5. 测试

- [x] 5.1 覆盖 score=0 时帧难度等于初始值（200 / 180 / 1600）
- [x] 5.2 覆盖得分递增后帧难度实时刷新，且 speed 不减小、gap/interval 不增大
- [x] 5.3 覆盖生成调度：interval 随得分缩短且不越下限 800
- [x] 5.4 覆盖新管道开口间距等于实时 gap 且不越下限 110
- [x] 5.5 覆盖管道移动位移等于 `speed * dt` 且 speed 不越上限 340
- [x] 5.6 覆盖重开：得分归零、首帧难度等于初始值（与第 0 分一致）
- [x] 5.7 覆盖确定性：连续两局相同得分下难度逐项相等（误差 = 0）
- [x] 5.8 静态断言游戏循环 / 生成 / 移动无硬编码难度魔法数字
- [x] 5.9 运行 `bun test` 全量通过，难度相关覆盖率 ≥ 90%