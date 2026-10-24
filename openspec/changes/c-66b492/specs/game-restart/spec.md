# 重开重置 — 验收规范

> 能力：`game-restart`

## ADDED Requirements

### Requirement: 死亡后重开得分归零

系统 SHALL 在玩家死亡并触发重开后，将当前得分重置为 0。

#### Scenario: 重开得分归零
- **WHEN** 玩家死亡后触发重开（点击「再来一局」或按重试键）
- **THEN** 当前得分立即变为 0

### Requirement: 重开难度重置为初始值

系统 SHALL 在重开后让难度三元组恢复为配置初始值，与 score=0 状态逐字段一致。

#### Scenario: 重开第一帧难度为初始值
- **WHEN** 重开后的第一帧更新
- **THEN** speed / gap / interval 分别等于配置初始值（200 / 180 / 1600），与 `calculateDifficulty(0)` 逐字段一致

### Requirement: 重开重置确定性

系统 SHALL 保证连续两局达到相同得分时难度值逐项完全相等（误差 = 0）。

#### Scenario: 两局同分同难度
- **WHEN** 连续进行两局并在各自得分 s 时读取难度
- **THEN** 两局的 speed / gap / interval 逐项相等（误差 = 0），与历史得分无关
