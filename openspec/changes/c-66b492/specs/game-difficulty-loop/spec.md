# 游戏主循环难度消费 — 验收规范

> 能力：`game-difficulty-loop`
> 依赖：`difficulty-curve` 的 `calculateDifficulty(score) => { speed, gap, interval }`（单位 px/s、px、ms）

## ADDED Requirements

### Requirement: 每帧按当前得分刷新难度三元组

系统 SHALL 在游戏主循环的每次更新（update）中，读取当前得分并调用 `calculateDifficulty(score)`，将返回的 `{ speed, gap, interval }` 作为该帧生效的实时难度值。

#### Scenario: 得分 0 时使用初始难度
- **WHEN** 游戏进行中且当前得分为 0，循环执行一次更新
- **THEN** 该帧的 speed / gap / interval 分别等于配置初始值（200 / 180 / 1600），与 `calculateDifficulty(0)` 逐字段一致

#### Scenario: 得分递增时难度实时刷新
- **WHEN** 当前得分从 n 变为 n+1 后的下一次更新
- **THEN** 该帧难度三元组等于 `calculateDifficulty(n+1)`，且 speed 不减小、gap 与 interval 不增大

### Requirement: 管道生成器使用实时生成间隔与开口间距

系统 SHALL 让管道生成器以实时 `interval` 决定下一次管道生成的时机，并让新生成管道的开口间距等于实时 `gap`。

#### Scenario: 生成时机由实时 interval 决定
- **WHEN** 生成器在得分 0 时完成一次生成
- **THEN** 下一次生成被安排在 `interval = 1600ms` 之后；得分上升后该间隔随之缩短且不小于配置下限 800

#### Scenario: 新管道开口间距使用实时 gap
- **WHEN** 生成器在得分 s 时生成一组新管道
- **THEN** 该管道开口间距等于 `calculateDifficulty(s).gap`，且不小于配置下限 110

### Requirement: 管道移动使用实时速度

系统 SHALL 让所有已生成与后续生成的管道以实时 `speed` 水平移动。

#### Scenario: 管道移动速度与实时难度一致
- **WHEN** 当前得分为 s 时管道执行一次移动
- **THEN** 位移量等于 `calculateDifficulty(s).speed * dt`，且 speed 不越配置上限 340

### Requirement: 参数无魔法数字

系统 SHALL 从配置常量表 `DIFFICULTY_CONFIG` 读取全部难度参数，游戏循环内不出现硬编码难度数值。

#### Scenario: 循环内无硬编码难度值
- **WHEN** 检查游戏循环 / 生成器 / 移动逻辑源码
- **THEN** 难度初始值、上下限、速率均来自 `DIFFICULTY_CONFIG` 或 `calculateDifficulty` 返回值，无魔法数字

### Requirement: 难度计算确定性

系统 SHALL 保证相同得分下计算出的难度值逐字段完全一致，不引入随机波动。

#### Scenario: 同分同值
- **WHEN** 在得分 s 处多次刷新难度
- **THEN** 每次 speed / gap / interval 与 `calculateDifficulty(s)` 逐字段相等（误差 = 0）
