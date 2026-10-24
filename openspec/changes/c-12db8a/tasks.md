# 实施清单 — 难度曲线计算函数

## 1. 类型与常量统一

- [x] 1.1 统一三旋钮 schema：定义 `DifficultyParam = { initial, ratePerScore, min, max }`，`DifficultyConfig = { pipeSpeed, gapHeight, spawnInterval }`，消除 5 参数 schema 与 3 旋钮 schema 的矛盾
- [x] 1.2 建立默认常量表：speed 200→340(+4)、gap 180→110(-2)、interval 1600→800(-20)，顶层与各旋钮对象 `Object.freeze`
- [x] 1.3 令 `MIN_GAP` 由 `constants.ts` 的 `MIN_GAP_HEIGHT`（碰撞盒高 + 上下安全余量）推导，移除魔法数字

## 2. 计算函数实现

- [x] 2.1 实现 `normalizeScore(score)`：负数 / NaN / undefined / 非有限数统一归一为 0
- [x] 2.2 实现 `calculateDifficulty(score, config?)`：线性计算 + `clamp` 边界钳制，返回 `{ speed, gap, interval }`
- [x] 2.3 config 缺省时回退内置默认常量表，保证调用不崩溃
- [x] 2.4 建立旋钮到返回字段的映射：speed←pipeSpeed、gap←gapHeight、interval←spawnInterval

## 3. 导出与清理

- [x] 3.1 通过 `src/config/index.ts` 与 `src/index.ts` barrel 导出 `calculateDifficulty` 及三旋钮类型
- [x] 3.2 处理遗留的 `computeDifficulty` / `computeDifficultyValue` 与 5 参数 `DIFFICULTY_CONFIG`：不再作为对外 API，避免双表并存

## 4. 测试

- [x] 4.1 覆盖 score=0 返回默认基线 `{ speed: 200, gap: 180, interval: 1600 }`
- [x] 4.2 覆盖边界分数：各旋钮封顶/触底临界分数（35 / 35 / 40）与超大分数（100000）
- [x] 4.3 覆盖非法输入：负数 / NaN / undefined 均返回与 score=0 一致且不抛异常
- [x] 4.4 覆盖单调性：speed 单调不减、gap/interval 单调不增，相邻差值 ≤ 速率 + 0.001
- [x] 4.5 覆盖不越界：speed ≤ 340、gap ≥ 110、interval ≥ 800
- [x] 4.6 覆盖 config 缺省回退与自定义 config 即时生效
- [x] 4.7 运行 `bun test` 全量通过，函数覆盖率 ≥ 90%
