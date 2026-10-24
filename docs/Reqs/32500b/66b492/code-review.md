# 代码审查 — 集成难度曲线到游戏循环并实现重开重置

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'severity': 'critical', 'title': '生成循环在 interval <= 0 时可能死循环，冻结主线程/页面', 'location': 'src/game/loop.ts:27-33 与 src/game/spawner.ts shouldSpawnPipe', 'description': 'step() 用 `while (shouldSpawnPipe(...))` 生成管道，shouldSpawnPipe 仅判断 `elapsedSinceSpawn >= difficulty.interval`。当 interval 为 0 或负数时（calculateDifficulty 接受任意 config，且无 `min > 0` 或正数校验），`state.elapsedSinceSpawn -= interval` 无法让累计值下降（减 0 不变、减负数反而增大），条件恒真，while 永不退出，导致游戏主循环死循环、页面无响应。默认常量表安全，但公共 API 允许传入 interval.min <= 0 的自定义 config，且难度类型未做运行时校验。', 'suggestion': '在 calculateDifficulty 或 shouldSpawnPipe 中强制 interval 为正（如 `Math.max(1, value)` 或校验 config），并在 while 前断言 `state.difficulty.interval > 0`；更稳妥的是用「单帧计算生成数量」的 for/计数方式替代 while，从结构上杜绝死循环。'}

## 🟡 警告（建议修复）
- {'severity': 'warning', 'title': '管道移出屏幕后永不回收，数组无限增长（内存/性能泄漏）', 'location': 'src/game/mover.ts movePipes / src/game/loop.ts step', 'description': 'movePipes 只做 `pipe.x -= dx`，loop 只 push 新管道，全流程没有对移出左屏幕（x + 宽度 < 0）的管道做移除或复用。长时间游玩后 state.pipes 会累积成百上千个对象，每帧遍历成本与内存占用持续上升，帧率逐渐下降。', 'suggestion': '在 step 或 mover 中增加回收逻辑，将移出屏幕的管道从 state.pipes 中过滤/移除（例如 `state.pipes = state.pipes.filter(p => p.x + PIPE_WIDTH > 0)`，注意不要与同帧遍历共享引用产生副作用）。'}
- {'severity': 'warning', 'title': '单帧大量生成时所有新管道 x 坐标相同，导致重叠', 'location': 'src/game/loop.ts:28-33', 'description': 'while 循环在单帧多次触发生成时（例如切后台、GC 卡顿导致 dt 很大，elapsedSinceSpawn 累积超过多个 interval），每次 `spawnPipe(PIPE_SPAWN_X, ...)` 都使用同一个 PIPE_SPAWN_X，多根管道完全重叠在同一水平位置，产生视觉堆叠与不公平/不可通过的障碍。', 'suggestion': '同帧内多次生成时按 interval 对应的位移对 x 做偏移（例如 `x = PIPE_SPAWN_X + i * speed * interval / 1000`），或改用单帧最多生成一个、把多余时间截断，避免重叠。'}
- {'severity': 'warning', 'title': 'restart() 未同步重置 difficulty，产生瞬态「得分与难度不一致」', 'location': 'src/game/state.ts restart', 'description': 'restart 将 score 归零、清空管道与计时器，但未更新 state.difficulty。在 restart 返回后、下一次 step 执行前这段窗口内，state 呈现 score=0 但 difficulty 仍是上一局高难度值的矛盾状态；若渲染层或任何读取 state.difficulty 的逻辑在此期间执行（例如 UI 显示速度、碰撞判定），会读到陈旧难度，恰好违背本模块注释自述的「杜绝得分与难度双源漂移」这一不变式。', 'suggestion': '在 restart 内显式 `state.difficulty = calculateDifficulty(0)`，保证 reset 后立即一致，而不是依赖「下一帧 step 才修正」的隐含时序。'}
- {'severity': 'warning', 'title': 'calculateDifficulty 对自定义 config 无任何合法性校验', 'location': 'src/config/difficulty.ts calculateDifficulty / clamp', 'description': '当传入自定义 config 时，未校验 min > max、NaN、Infinity、ratePerScore 符号、interval 非正等情况。min > max 时 clamp 会静默返回 max 等非预期值，NaN 会污染整个三元组（后续 while 条件、位移计算全部失效），没有报错或回退，问题被静默吞掉。', 'suggestion': '增加 config 校验（min <= max、值均有限、interval > 0），非法时抛错或回退到内置 DIFFICULTY_CONFIG；至少对 interval 做正数保护。'}

## 🟢 建议（可选优化）
- {'severity': 'suggestion', 'title': 'Pipe.gap 字段已生成但主循环/移动逻辑从未消费', 'location': 'src/game/types.ts Pipe.gap / src/game/spawner.ts spawnPipe', 'description': 'spawnPipe 写入 gap，但 loop/mover 均未读取该字段（碰撞/渲染逻辑未在本批代码中出现），当前属于死数据，且 Pipe 类型把「开口间距」语义绑定到单个管道而非全局难度，容易与同帧 difficulty.gap 产生两套口径。', 'suggestion': '明确 gap 的唯一消费方；若暂时无消费者可先不在 Pipe 上冗余存储，或补充注释说明其用途，避免与全局 difficulty.gap 造成双源。'}
- {'severity': 'suggestion', 'title': 'DifficultyResult 返回对象未冻结，与类型 readonly 及 config 冻结风格不一致', 'location': 'src/config/difficulty.ts calculateDifficulty', 'description': 'DIFFICULTY_CONFIG 及其旋钮均 Object.freeze，DifficultyResult 接口字段声明为 readonly，但 calculateDifficulty 返回的普通对象在运行时仍可变，调用方可 `state.difficulty.speed = 999` 破坏不变式，readonly 仅是编译期约束。', 'suggestion': '返回 `Object.freeze({ speed, gap, interval })`，与全局不可变风格保持一致。'}
- {'severity': 'suggestion', 'title': 'movePipes 参数类型 readonly Pipe[] 语义易误导', 'location': 'src/game/mover.ts movePipes', 'description': '`readonly Pipe[]` 只禁止对数组自身的增删（push/pop），不禁止对元素字段的修改（pipe.x -= dx 仍然生效）。参数命名意图是「不修改数组结构」，但类型表达不直观，易让阅读者误以为元素也不可变。', 'suggestion': '补充注释说明「readonly 仅约束数组结构，元素字段会被原地更新」，或采用更明确的 `{ x: number }` 最小接口收窄入参。'}
- {'severity': 'suggestion', 'title': 'spawn 计时用逐次相减，长时间运行存在累积漂移', 'location': 'src/game/loop.ts:29-31', 'description': 'while 内 `state.elapsedSinceSpawn -= interval` 逐次相减，浮点/整数误差会随时间累积；且一次性生成数量由 while 隐式决定，逻辑不如「一次性算出生成数量并截断余量」清晰。', 'suggestion': '改为 `const count = Math.floor(elapsedSinceSpawn / interval)` 一次性生成，余量用取模保留，减少循环与误差。'}

## 审查的代码
- openspec/changes/c-66b492/tasks.md
- docs/Reqs/32500b/66b492/dev-notes.md
