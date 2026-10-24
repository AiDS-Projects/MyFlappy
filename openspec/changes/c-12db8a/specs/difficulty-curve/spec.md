# 难度曲线计算 — 验收规范

> 能力：`difficulty-curve`
> 函数契约：`calculateDifficulty(score, config?) => { speed, gap, interval }`
> 单位：`speed`（px/s）、`gap`（px）、`interval`（ms）

## ADDED Requirements

### Requirement: 按线性公式计算并做边界钳制

系统 SHALL 提供纯函数 `calculateDifficulty(score, config?)`，基于分数与难度常量表按线性规则计算三个旋钮，并对结果做边界钳制：

- `speed = min(baseSpeed + speedPerScore * score, maxSpeed)`
- `gap = max(baseGap - gapDecreasePerScore * score, minGap)`
- `interval = max(baseSpawnInterval - spawnDecreasePerScore * score, minSpawnInterval)`

#### Scenario: score 为 0 时返回默认基线
- **WHEN** 以 `score = 0` 调用 `calculateDifficulty`
- **THEN** 返回 `{ speed: 200, gap: 180, interval: 1600 }`，与默认常量表的初始值逐字段严格相等

#### Scenario: score 达到速度上限封顶分数后不再增长
- **WHEN** 以足以使 `speed` 超过上限的 `score` 调用（如 `score >= 35`，因 `(340-200)/4 = 35`）
- **THEN** 返回的 `speed` 恒等于 `MAX_SPEED`（340），不再随分数上升

#### Scenario: score 达到开口间距触底分数后不再收窄
- **WHEN** 以足以使 `gap` 低于下限的 `score` 调用（如 `score >= 35`，因 `(180-110)/2 = 35`）
- **THEN** 返回的 `gap` 恒等于 `MIN_GAP`（110），不再随分数收窄

#### Scenario: score 达到生成间隔触底分数后不再缩短
- **WHEN** 以足以使 `interval` 低于下限的 `score` 调用（如 `score >= 40`，因 `(1600-800)/20 = 40`）
- **THEN** 返回的 `interval` 恒等于 `MIN_SPAWN_INTERVAL`（800），不再随分数缩短

### Requirement: 非法分数输入按 0 处理

系统 SHALL 将负数、NaN、undefined 等非法分数统一视为 0，且不抛异常。

#### Scenario: 负数分数
- **WHEN** 以 `score = -5` 调用 `calculateDifficulty`
- **THEN** 返回结果与 `score = 0` 时完全一致，且不抛异常

#### Scenario: NaN 分数
- **WHEN** 以 `score = NaN` 调用 `calculateDifficulty`
- **THEN** 返回结果与 `score = 0` 时完全一致，且不抛异常

#### Scenario: undefined 分数
- **WHEN** 不传 `score` 参数调用 `calculateDifficulty`
- **THEN** 返回结果与 `score = 0` 时完全一致，且不抛异常

### Requirement: 单调性与平滑性

系统 SHALL 保证 `speed` 随分数单调不减，`gap` 与 `interval` 随分数单调不增，且相邻分数的变化量不超过对应速率，确保无跳变。

#### Scenario: speed 单调不减
- **WHEN** 分数从 0 到 200 逐 1 递增并依次计算 `speed`
- **THEN** 任意相邻分数的 `speed[n+1] >= speed[n]`

#### Scenario: speed 无跳变
- **WHEN** 分数从 0 到 200 逐 1 递增并依次计算 `speed`
- **THEN** 任意相邻分数的 `speed` 差值 `<= speedPerScore + 0.001`

#### Scenario: gap 单调不增
- **WHEN** 分数从 0 到 200 逐 1 递增并依次计算 `gap`
- **THEN** 任意相邻分数的 `gap[n+1] <= gap[n]`，且差值 `<= gapDecreasePerScore + 0.001`

#### Scenario: interval 单调不增
- **WHEN** 分数从 0 到 200 逐 1 递增并依次计算 `interval`
- **THEN** 任意相邻分数的 `interval[n+1] <= interval[n]`，且差值 `<= spawnDecreasePerScore + 0.001`

### Requirement: 结果不越界

系统 SHALL 保证任意分数（含 0 到 100000）下，`speed` 不超过上限、`gap` 与 `interval` 不低于下限。

#### Scenario: speed 不越上限
- **WHEN** 以任意 `score`（含 100000）调用 `calculateDifficulty`
- **THEN** 返回的 `speed <= MAX_SPEED`（340）

#### Scenario: gap 不越下限
- **WHEN** 以任意 `score` 调用 `calculateDifficulty`
- **THEN** 返回的 `gap >= MIN_GAP`（110）

#### Scenario: interval 不越下限
- **WHEN** 以任意 `score` 调用 `calculateDifficulty`
- **THEN** 返回的 `interval >= MIN_SPAWN_INTERVAL`（800）

### Requirement: config 缺省回退与即时生效

系统 SHALL 在 config 参数缺失时使用内置默认常量表，保证调用不崩溃；SHALL 在传入自定义 config 时立即按其数值计算，无需改动函数体或调用方。

#### Scenario: config 缺失时使用默认常量表
- **WHEN** 不传 `config` 参数调用 `calculateDifficulty(0)`
- **THEN** 返回 `{ speed: 200, gap: 180, interval: 1600 }`，且不崩溃

#### Scenario: 修改常量表数值后立即生效
- **WHEN** 传入 `speedPerScore` 与默认不同的自定义 `config`
- **THEN** 返回的 `speed` 随新的 `speedPerScore` 线性变化，无需改动函数体

### Requirement: 开口间距理论可通过

系统 SHALL 保证开口间距下限不小于小鸟碰撞盒高度与上下安全余量之和，确保管道理论可通过。

#### Scenario: 间距下限由物理边界推导
- **WHEN** 查看 `MIN_GAP` 与小鸟碰撞盒高度、安全余量的关系
- **THEN** `MIN_GAP >= 碰撞盒高度 + 上下余量之和`（示例：碰撞盒高 50px、上下各 30px，则 `MIN_GAP = 110`）