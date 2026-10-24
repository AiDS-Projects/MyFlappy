# 代码审查 — 集成难度曲线到游戏循环并实现重开重置

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/game/loop.ts', 'line': 'step(state, dt)', 'title': 'dt 未做有限性与非负校验，NaN 污染不可自愈', 'detail': 'step 直接信任外部传入的 dt。若 dt 为 NaN（rAF 首帧时间戳异常、performance.now() 边界等），`state.elapsedSinceSpawn += dt * MS_PER_SECOND` 变为 NaN；`movePipes` 中 `dx = speed * dt` 为 NaN，`pipe.x -= dx` 使 pipe.x 永久变 NaN（NaN - 任意数仍为 NaN）。一旦写入，碰撞检测与渲染判定全部失效且无法自愈，只有 restart 清空 pipes 才能恢复。应对 dt 做 `Number.isFinite(dt) && dt >= 0` 校验并钳制上限。'}

## 🟡 警告（建议修复）
- {'file': 'src/game/state.ts', 'title': 'restart 不重置 difficulty，破坏「得分与难度单一事实来源」不变式', 'detail': 'restart 将 score 归零、清空 pipes 与计时器，但未更新 difficulty。在下一帧 step 执行前，存在 score=0 而 difficulty 仍为旧高难度值的短暂双源漂移。任何在 step 之前读取 difficulty 的渲染/存档逻辑会拿到脏数据。建议在 restart 内显式 `state.difficulty = calculateDifficulty(0)`，而不是依赖下一帧副作用。'}
- {'file': 'src/game/loop.ts', 'title': '大 dt 补帧生成导致管道重叠', 'detail': '后台切回或单帧卡顿（dt 达数秒）时，`while (shouldSpawnPipe(...))` 一次性生成多根管道，全部出生在 PIPE_SPAWN_X(480) 同一坐标，且 gapCenterY 恒为 300，管道完全重叠。缺少按 speed*interval 水平间距补偿或 dt 钳制，切后台 5 秒即可复现，破坏关卡间距。'}
- {'file': 'src/game/spawner.ts / src/game/constants.ts', 'title': 'gapCenterY 固定 300，无随机化', 'detail': 'spawnPipe 始终使用 PIPE_GAP_CENTER_Y=300，所有管道开口中心纵坐标完全相同。对 Flappy Bird 类玩法，开口必须随机关卡化，否则游戏无随机性、实际不可玩。PIPE_GAP_CENTER_Y 作为常量被直接消费，缺少随机化调用点。'}
- {'file': 'src/game/loop.ts', 'title': 'while 循环依赖 interval > 0，自定义 config 可死循环', 'detail': 'shouldSpawnPipe 返回 `elapsedSinceSpawn >= difficulty.interval`。若调用方传入自定义 DifficultyConfig 且 spawnInterval.min <= 0，interval 可被 clamp 到 0 或负值，`elapsedSinceSpawn -= interval` 无法递减，while 死循环挂死主线程。默认配置 min=800 安全，但缺少防御（例如 interval <= 0 时提前 break）。'}
- {'file': 'src/game/mover.ts', 'title': 'readonly Pipe[] 却原地修改元素，类型契约误导', 'detail': 'movePipes 参数声明为 `readonly Pipe[]`，但循环内 `pipe.x -= dx` 原地修改元素属性。`readonly` 仅约束数组本身（不可 push/reassign），并不阻止元素字段变异。契约语义与实际行为矛盾，易让调用方误以为传入安全。应改为 `Pipe[]` 并明确注释「原地修改 x」，或改用不可变返回。'}

## 🟢 建议（可选优化）
- {'file': 'src/game/loop.ts', 'title': '每帧重算并新分配 difficulty 对象', 'detail': '`state.difficulty = calculateDifficulty(state.score)` 每帧无条件执行，且 calculateDifficulty 每次返回新对象。得分未变时仍产生无谓分配。可缓存 `上次 score → difficulty`，仅当 score 变化时重算。'}
- {'file': 'src/config/difficulty.ts', 'title': 'clamp 未校验 min <= max', 'detail': 'clamp 实现为 `Math.min(max, Math.max(min, value))`。若配置错误导致 min > max（如自定义 config），结果恒为 max，问题被静默掩盖难以定位。建议在 clamp 内加断言或至少在 JSDoc 注明前置条件。'}
- {'file': 'src/config/difficulty.ts', 'title': 'normalizeScore 对小数 score 语义未声明', 'detail': 'normalizeScore 对合法小数（如 3.7）原样返回，但 Flappy Bird 得分通常为整数。当前契约是「不做取整」，建议在 JSDoc 明确说明小数得分的允许范围与线性插值语义，避免调用方误用。'}
- {'file': 'src/config/index.ts / src/config/difficulty.ts', 'title': '类型定义分散、重复 re-export', 'detail': 'DifficultyResult 定义在 difficulty.ts，而 DifficultyParam/DifficultyConfig 定义在 difficulty.types.ts，且 difficulty.ts 与 config/index.ts 均 re-export 类型，存在重复导出。可统一类型出口位置，减少心智负担。'}
- {'file': 'src/game/loop.ts / src/game/mover.ts / src/game/spawner.ts', 'title': '注释偏「what」而少「why」', 'detail': '多处注释重复描述代码字面行为（如「所有管道统一消费同帧 speed 快照」），未解释关键设计动机。可精简 what 类注释，补充 why 类（如为何 while 循环先减 interval 再生成、为何移动在生成之后）。'}

## 审查的代码
- openspec/changes/c-66b492/tasks.md
- docs/Reqs/32500b/66b492/dev-notes.md
