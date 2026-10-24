# PRD — 实现随分数递增的难度曲线计算函数

> 所属需求：核心玩法：难度递增曲线

## 用户故事
As a 玩家，I want 游戏难度随我的得分平滑且可预期地提升，So that 我在「再来一局冲记录」时始终感到挑战递增，且每一局都感觉公平、理论可通过。

## 功能需求
实现一个纯函数 calculateDifficulty(score, config)，基于分数与集中式难度常量表计算并返回当前难度参数，供管道生成与移动逻辑调用。\n\n1. 难度常量表（集中配置，便于调平衡）：\n   - BASE_SPEED = 200（px/s，得分 0 时的管道移动速度）\n   - MAX_SPEED = 340（px/s，速度上限）\n   - SPEED_PER_SCORE = 4（每 1 分速度增量）\n   - BASE_GAP = 180（px，得分 0 时管道上下开口间距）\n   - MIN_GAP = 110（px，开口间距下限）\n   - GAP_DECREASE_PER_SCORE = 2（每 1 分间距缩减量）\n   - BASE_SPAWN_INTERVAL = 1600（ms，得分 0 时管道生成间隔）\n   - MIN_SPAWN_INTERVAL = 800（ms，生成间隔下限）\n   - SPAWN_DECREASE_PER_SCORE = 20（每 1 分生成间隔缩减量）\n   [假设] 以上数值为 Phaser 像素/毫秒量级默认值，实际以项目现有管道速度与画布尺寸为准，可整表微调。\n\n2. 计算规则（线性 + 边界钳制，保证平滑且不越界）：\n   - speed = min(BASE_SPEED + SPEED_PER_SCORE * score, MAX_SPEED)\n   - gap = max(BASE_GAP - GAP_DECREASE_PER_SCORE * score, MIN_GAP)\n   - interval = max(BASE_SPAWN_INTERVAL - SPAWN_DECREASE_PER_SCORE * score, MIN_SPAWN_INTERVAL)\n\n3. 函数签名：calculateDifficulty(score: number, config: DifficultyConfig): { speed: number; gap: number; interval: number }。\n   - score 非法（负数 / NaN / undefined）一律按 0 处理，不抛异常。\n   - config 缺失时使用内置默认常量表，保证调用不崩溃。\n\n4. 返回值三字段均为 number，单位分别为 px/s、px、ms，调用方（管道移动、生成间隔定时器）直接消费。\n\n5. 难度参数只读自常量表，除 calculateDifficulty 外禁止在管道/生成逻辑中散落魔法数字。

## 验收标准
- [ ] 输入 score=0 时，返回 { speed: 200, gap: 180, interval: 1600 }，与常量表默认值逐字段严格相等。\n- [ ] 当 score 从 0 到 200 逐 1 递增时，speed 单调不减（speed[n+1] >= speed[n]），且任意相邻分数的 speed 差值 ≤ SPEED_PER_SCORE + 0.001，即无跳变。\n- [ ] 任意 score（含 0 到 100000）下 speed ≤ MAX_SPEED(340)，不越界上限。\n- [ ] 当 score 从 0 到 200 逐 1 递增时，gap 单调不增（gap[n+1] <= gap[n]），任意相邻分数 gap 差值 ≤ GAP_DECREASE_PER_SCORE + 0.001。\n- [ ] 任意 score 下 gap ≥ MIN_GAP(110)，不越界下限。\n- [ ] 任意 score 下 interval ≥ MIN_SPAWN_INTERVAL(800)，不越界下限。\n- [ ] MIN_GAP(110) 必须 ≥ 小鸟碰撞盒高度 + 上下各 30px 余量（假设小鸟碰撞盒高 50px，即 50+60=110），保证管道理论可通过。\n- [ ] 输入 score 为负数或 NaN 时，函数返回与 score=0 完全一致的结果，且不抛异常。\n- [ ] 修改常量表中任意一个数值后，函数输出随新值立即生效，无需改动函数体或调用方代码。\n- [ ] 单元测试覆盖率 ≥ 90%，覆盖：边界分数（0、达到上限/下限的临界分数、超大分数）、非法输入、单调性。

## 边界条件（不做的事）
不包含：移动管道、旋转门等多种障碍物。\n不包含：护盾、慢速等道具系统。\n不包含：难度曲线可视化或实时调参面板。\n不包含：死亡后重置逻辑本身——由调用方在重开时重新传入 score=0 以获得初始难度，本函数仅做纯计算。\n不包含：音效、动画、UI 等表现层内容。\n暂不支持：非线性的平滑缓动曲线（如 ease-in/ease-out），本期采用线性 + 钳制实现，后续可平滑替换为平滑曲线而不影响调用接口。

## 资产需求线索
暂无
