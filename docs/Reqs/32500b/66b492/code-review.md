# 代码审查 — 集成难度曲线到游戏循环并实现重开重置

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/game/loop.ts', 'line': 44, 'severity': 'critical', 'message': '生成调度的 while 循环没有单帧生成数量上限，且对 dt 未做任何钳制。当页面切后台、设备休眠或调试暂停导致 dt 异常放大（秒级甚至分钟级）时，elapsedSinceSpawn 会一次性累积巨大值，循环会在同一帧生成数十到数百根管道（默认 interval 下限 800ms，dt=60s 即约 75 根），全部堆叠在 PIPE_SPAWN_X 处，引发该帧卡顿→下一帧 dt 更大→生成更多管道的死亡螺旋，严重时可卡死或耗尽内存。', 'suggestion': '对 dt 设置上限（如 Math.min(dt, 0.1)），或限制单帧最多生成 N 根管道，超出部分直接截断计时器（elapsedSinceSpawn = elapsedSinceSpawn % interval），保证单帧管道增量有界。'}

## 🟡 警告（建议修复）
- {'file': 'src/game/state.ts', 'line': 66, 'severity': 'warning', 'message': 'restart() 将 score 归零、清空 pipes 与计时器，但未同步重置 state.difficulty，使其在「restart 后、下一帧 step 前」窗口内残留上一局的最高难度快照。虽然注释声称由下一帧派生，但 state 中同时持有 score 与 difficulty 两个事实源（冗余缓存），任何在 ready 阶段读取 state.difficulty 的逻辑（渲染、UI 展示、调试）都会拿到过期值，属双源漂移隐患。', 'suggestion': '在 restart() 内同步执行 state.difficulty = calculateDifficulty(0)，或从 GameState 中移除冗余的 difficulty 缓存字段，改为按需派生。'}
- {'file': 'src/game/loop.ts', 'line': 51, 'severity': 'warning', 'message': 'pipes 数组只 push 不清理，没有离屏回收逻辑。管道左移出屏幕后依然驻留内存，长时间游玩下数组无限增长，导致 movePipes 每帧遍历成本与内存占用持续上升。', 'suggestion': '在 movePipes 后（或移动逻辑内）过滤/移除 x 已越过屏幕左缘的管道，例如 pipes = pipes.filter(p => p.x + 管道宽度 > 0)。'}
- {'file': 'src/game/loop.ts', 'line': 45, 'severity': 'warning', 'message': 'while 循环终止完全依赖 difficulty.interval 为正数。calculateDifficulty 允许传入自定义 config 且不校验字段合法性，若外部 config 将 spawnInterval.min 设为 0 或负值，interval 恒为 0 会导致 while 死循环（elapsedSinceSpawn 永远 >= 0）。', 'suggestion': '在 while 条件中额外加 interval > 0 守卫，或对传入 config 的 interval 做下限钳制（如 clamp 到至少 1ms）。'}
- {'file': 'src/game/loop.ts', 'line': 40, 'severity': 'warning', 'message': 'dt 无任何校验。dt 为负（时钟回拨/计时器异常）时，elapsedSinceSpawn 会倒退、movePipes 中 dx 为负导致管道向右反向移动；dt 为 NaN 时所有派生状态被污染为 NaN。', 'suggestion': '在 step 入口校验 dt：if (!Number.isFinite(dt) || dt <= 0) return；并按需上限钳制。'}

## 🟢 建议（可选优化）
- {'file': 'src/game/mover.ts', 'line': 28, 'severity': 'suggestion', 'message': 'movePipes 参数声明为 readonly Pipe[] 却原地修改 pipe.x，readonly 仅约束数组本身不约束元素属性，类型契约与实际行为相矛盾，容易误导调用方误以为不会修改元素。', 'suggestion': '改为 Pipe[]，或采用不可变风格返回新数组（map 生成新对象）。'}
- {'file': 'src/config/difficulty.ts', 'line': 24, 'severity': 'suggestion', 'message': 'DifficultyResult 接口字段声明 readonly，但 calculateDifficulty 返回的是普通可变对象字面量，运行时仍可被改写（如 state.difficulty.speed = 0），与 DIFFICULTY_CONFIG 的 Object.freeze 不可变约定不一致。', 'suggestion': '对返回值 Object.freeze，或在注释中明确 readonly 仅为编译期约束。'}
- {'file': 'src/game/state.ts', 'line': 44, 'severity': 'suggestion', 'message': 'createGameState 与 restart 存在重复的初始化逻辑（phase、pipes、elapsedSinceSpawn 等字段的归零/初始化分散两处），后续新增状态字段易漏改其中一处。', 'suggestion': '抽取共享的 reset 逻辑或让 restart 复用 createGameState 的初始化结果。'}
- {'file': 'src/config/difficulty.ts', 'line': 72, 'severity': 'suggestion', 'message': 'normalizeScore 不取整，小数分数会传递到难度计算，导致 speed/gap/interval 出现非整数微抖动（虽然线性模型本身允许，但与分数「每 1 分」的整数语义不符）。', 'suggestion': '若分数为整数语义，建议 Math.floor 后再参与计算。'}
- {'file': 'src/game/loop.ts', 'line': 33, 'severity': 'suggestion', 'message': 'step 每帧无条件重算 calculateDifficulty，即使 score 未变化也重新派生三元组，属可接受但略冗余的开销。', 'suggestion': '可选优化：仅在 score 变化时重算并缓存，减少每帧对象分配。'}

## 审查的代码
- openspec/changes/c-66b492/tasks.md
- docs/Reqs/32500b/66b492/dev-notes.md
