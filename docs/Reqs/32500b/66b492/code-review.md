# 代码审查 — 集成难度曲线到游戏循环并实现重开重置

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/game/loop.ts', 'function': 'step', 'title': '单帧突增生成导致管道重叠堆叠', 'description': '生成调度使用 `while (shouldSpawnPipe(state.elapsedSinceSpawn, state.difficulty))`，且每次生成都使用固定的 `PIPE_SPAWN_X`。当 dt 较大时（浏览器切后台/标签页挂起后恢复、调试器暂停、首帧初始化等常见场景），`elapsedSinceSpawn` 会一次性累积为 interval 的数倍，while 循环会在同一帧内连续 push 多个管道，且它们全部位于同一 x=480 坐标，造成管道重叠堆叠、视觉错乱，并导致该帧卡顿。', 'suggestion': '将 while 改为单次判断（if）或对单帧生成数量设上限；若确需补生成多根，应让后续管道按 interval 间距偏移出生 x（如 x = PIPE_SPAWN_X + i * spacing），避免同帧同坐标堆叠。'}
- {'file': 'src/game/loop.ts', 'function': 'step', 'title': '管道无回收逻辑导致数组无限增长', 'description': '提供的代码中 `state.pipes` 只通过 `push` 增加，`movePipes` 只将管道左移，未见任何移除（离开屏幕左侧后剔除）或对象池复用逻辑。长期运行下数组长度线性无限增长，`movePipes` 每帧遍历全部管道，导致每帧耗时与内存持续膨胀，最终掉帧甚至内存泄漏。', 'suggestion': '在 step 中过滤掉 x 已移出屏幕左缘（例如 x + 管道宽度 < 0）的管道，或引入对象池复用，保证 pipes 长度有界。'}

## 🟡 警告（建议修复）
- {'file': 'src/game/state.ts', 'function': 'restart', 'title': 'restart 未重置 difficulty，留下旧难度快照', 'description': '`restart` 将 score 归零、清空 pipes 与计时器，但未同步重置 `state.difficulty`。在下一帧 `step` 调用 `calculateDifficulty(0)` 之前，任何读取 `state.difficulty` 的代码（渲染 ready 界面、碰撞/预览逻辑）都会读到重开前的旧难度值，与 score=0 的状态不一致，违背代码注释中「难度是 score 的派生值、单一事实来源」的强一致承诺。', 'suggestion': '在 restart 中显式执行 `state.difficulty = calculateDifficulty(0)`（或直接复用 createGameState 逻辑），消除重开瞬间的状态不一致窗口。'}
- {'file': 'src/game/loop.ts', 'function': 'step', 'title': 'while 循环在 interval ≤ 0 时会死循环/不终止', 'description': '`shouldSpawnPipe` 判定 `elapsedSinceSpawn >= interval`，循环体内 `elapsedSinceSpawn -= interval`。默认配置下 interval 被 clamp 到 [800, 1600] 恒为正，当前不会触发；但若传入自定义 config 或未来调整将 interval 下限改为 0 或负值，`elapsedSinceSpawn` 永远不会减小，while 将无限循环卡死主线程。', 'suggestion': '在循环体内对 interval 做 `Math.max(interval, 1)` 之类的正数兜底，或改用 for 上限 + if 的防御式写法。'}
- {'file': 'src/game/loop.ts', 'function': 'step', 'title': 'dt 未校验，NaN/负数会污染游戏状态', 'description': '`dt` 直接参与 `elapsedSinceSpawn += dt * MS_PER_SECOND` 与 `pipe.x -= speed * dt`。若 dt 为 NaN（时间源异常）或负数（时间回拨），elapsedSinceSpawn 变为 NaN（之后永远不生成），管道 x 变为 NaN（管道不可见且不可碰撞），状态被静默破坏且无任何报错。', 'suggestion': '在 step 入口对 dt 做归一化：`if (!Number.isFinite(dt) || dt < 0) dt = 0;` 并考虑对 dt 设上限（如 clamp 到 0~100ms）防止大 dt 突增。'}
- {'file': 'src/game/mover.ts', 'function': 'movePipes', 'title': 'readonly Pipe[] 形参却被原地修改，类型契约误导', 'description': '`movePipes(pipes: readonly Pipe[], ...)` 声明只读数组，但循环体内执行 `pipe.x -= dx` 直接修改了元素对象。`readonly Pipe[]` 只约束数组本身不可增删，元素仍是可变对象，该标注会误导调用方误以为函数不产生副作用；若调用方传入被 `Object.freeze` 的 Pipe 对象，在 ES 模块严格模式下赋值会抛 TypeError。', 'suggestion': '要么去掉 `readonly` 以如实反映「会修改元素」的语义，要么改为返回新数组（不可变风格），保持类型与实际行为一致。'}
- {'file': 'src/config/difficulty.ts', 'function': 'calculateDifficulty', 'title': '自定义 config 数值未校验，可能产出 NaN 结果', 'description': '`normalizeScore` 对 score 做了归一化，但传入的 config 各旋钮的 initial/ratePerScore/min/max 未做任何校验。若自定义 config 含 NaN 或非法值，clamp 结果会静默变为 NaN，进而污染 speed/gap/interval，最终传导到管道移动与生成。', 'suggestion': '对 config 关键字段做有限数与区间合法性校验，或在文档中明确「config 必须提供合法有限数值」。'}

## 🟢 建议（可选优化）
- {'file': 'src/config/difficulty.ts', 'title': 'DifficultyResult 类型定义与 difficulty.types.ts 分离', 'description': '`DifficultyConfig`/`DifficultyParam` 定义在 difficulty.types.ts，而 `DifficultyResult` 却定义在 difficulty.ts，类型定义散落两处，增加查找成本，与「types.ts 统一收口类型」的命名意图不一致。', 'suggestion': '将 DifficultyResult 一并移入 difficulty.types.ts 统一管理。'}
- {'file': 'src/config/difficulty.ts', 'function': 'frozenParam', 'title': 'Object.freeze 的不可变语义未反映到类型层', 'description': '`frozenParam` 返回类型标注为 `DifficultyParam`，虽字段为 readonly，但未用 `Readonly<DifficultyParam>` 或 `as const` 表达深度不可变；`Object.freeze` 只是运行时保障，编译期无法阻止对嵌套结构的改写尝试。', 'suggestion': '返回类型改为 `Readonly<DifficultyParam>`，使冻结语义在类型层面可见。'}
- {'file': 'src/game/loop.ts', 'function': 'step', 'title': 'while 循环内重复读取 state.difficulty.interval', 'description': '循环条件与循环体多次访问 `state.difficulty.interval`（及 shouldSpawnPipe 内部再次读取），可读性一般且轻微重复。', 'suggestion': '在循环前缓存 `const interval = state.difficulty.interval`，循环内复用。'}
- {'file': 'src/config/difficulty.ts', 'function': 'normalizeScore', 'title': 'normalizeScore 不取整的语义建议补充说明', 'description': '`normalizeScore` 对合法分数原样返回、不做取整。若分数为小数（例如 12.5），难度曲线会产出非整数 speed/gap，与实际计分粒度可能不一致，文档未说明这一取舍的原因。', 'suggestion': '在注释中补充「为何保留小数/不取整」的设计意图，或明确调用方需传入整数分。'}

## 审查的代码
- openspec/changes/c-66b492/tasks.md
- docs/Reqs/32500b/66b492/dev-notes.md
