# 架构设计 - 实现随分数递增的难度曲线计算函数

## 架构模式
pure-function-difficulty-curve（配置驱动的纯函数难度曲线层，无状态派生）

## 技术栈

- **language**: TypeScript
- **framework**: Phaser 3 (arcade physics)
- **build**: Vite
- **test**: Vitest
- **module_system**: ESM
- **type_check**: tsc --noEmit (tsconfig strict)
- **new_dependencies**: 无（复用现有栈，不引入新库）

## 模块设计

### 
职责: 扩展难度参数联合类型与配置表：在 DifficultyParamKey 中新增 'gapHeight'（管道上下开口间距），并在 DIFFICULTY_CONFIG 中补齐其配置项（initial/rate 为负/min/max）。同时新增类型化 DifficultySnapshot 接口，仅暴露本需求范围内的三个连续量：pipeSpeed、gapHeight、spawnIntervalMs。

### 
职责: 难度曲线计算纯函数层，基于分数与配置常量表计算当前速度/开口间距/生成间隔。内部复用现有 linear ramp（initial + rate * score）并 clamp 到 [min, max]，保证单调连续、不越界。提供粒度化计算函数与聚合快照函数，并预留可选 smoothstep/easeOutCubic 缓动用于接近 min/max 时软着陆（默认 linear，避免过度设计）。

### 
职责: 物理边界常量单一事实来源（已部署）：BIRD_COLLISION_WIDTH/HEIGHT、GAP_SAFE_MARGIN、MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2。gapHeight 的 min 由 MIN_GAP_HEIGHT 派生，保证理论可通过。

### 
职责: 统一出口：re-export difficulty.ts 与 difficultyCurve.ts，供场景/生成逻辑以单一入口导入，避免散落深路径导入。

### 
职责: 单元测试锁定曲线行为：score=0 时快照等于各 initial；单调性（speed 递增、gap/interval 递减）；越界截断（极大 score 时钳制在 min/max）；方向正确性（负 rate 参数递减）；死亡重开等价于 score 归零回落 initial。

## 关键决策
- 无状态纯函数：难度仅由 score 派生，不引入全局可变难度状态 —— 死亡重开即 score 归零，难度自然重置，避免状态同步 bug（Why: 验收要求『死亡后重开难度重置』，纯函数使其免费成立）。
- 增量补参而非重写：复用已部署的 linear ramp + clamp 模型，仅新增缺失的 gapHeight 参数，不动 obstacleSpeed/spawnIntervalMs 既有配置（Why: 遵守『已有代码不推翻』，前一工单的配置表已 deployed）。
- gapHeight 用负 rate + min 约束：min 取自物理边界常量 MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2，保证最小间距理论可过（Why: 满足『速度和间距均有限制，保证理论可通过』）。
- 类型化快照替代裸 Record：新增 DifficultySnapshot 仅暴露范围三参，调用点获得编译期类型安全，避免拼错 key 与误用离散参数（Why: 现 computeDifficulty 返回 Record<DifficultyParamKey, number>，宽泛且含 maxObstacles 等离散量）。
- 平滑性取舍：默认 linear + clamp 已连续单调满足『无明显跳变』；预留可选 smoothstep 缓动消除 min/max 处导数拐点，但默认关闭以控制复杂度（Why: 避免为未验证的手感需求过度设计）。
