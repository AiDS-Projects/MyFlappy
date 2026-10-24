# 代码审查 — 集成难度曲线到游戏循环并实现重开重置

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- src/game/loop.ts step(): 生成调度 while 循环无上界保护。shouldSpawnPipe 判断 elapsedSinceSpawn >= interval 后执行 elapsedSinceSpawn -= interval，若 interval <= 0（calculateDifficulty 作为公开 API 接受任意 config，未校验 spawnInterval.min/max 及 min>0），或 dt 为 NaN/Infinity（requestAnimationFrame 首帧/时钟回退/后台恢复时可能产生），减法无法让计时器下降，导致死循环、页面冻结。默认配置 interval 恒为 [800,1600] 才未触发，属潜在崩溃。

## 🟡 警告（建议修复）
- src/game/state.ts restart(): 未重置 state.difficulty。注释声称「重开第一帧 = score 0 = 初始难度」的强一致，但 restart 后到下一帧 step 之间，difficulty 仍是上一局最高分时的旧值；任何在此窗口内读取 difficulty（如 ready 屏渲染/管道预览）都会拿到过期的最大难度，与文档不变量相悖。
- src/config/difficulty.ts calculateDifficulty(): config 参数无结构校验。若运行时传入缺失某旋钮的对象（如只有 pipeSpeed），访问 c.gapHeight.initial 会抛 TypeError 崩溃；config 内出现 NaN 时 clamp(NaN,min,max) 返回 NaN 并沿 speed/gap/interval 传播到 movePipes 与 spawnPipe，污染状态。
- src/game/loop.ts step(): 在 phase 守卫之前每帧无条件重算 difficulty，ready/gameover 阶段（score 已冻结）仍做无用计算；且 dt 未做非负/有限值清洗，NaN 会永久污染 elapsedSinceSpawn 累积器。
- src/game/loop.ts: 大帧间隔（后台切回、dt 达数秒）会使 elapsedSinceSpawn 一次性跨越多个 interval，while 一次性批量生成多根管道，造成同帧大量实体突入的尖峰，缺少单帧生成数量上限。

## 🟢 建议（可选优化）
- src/game/state.ts restart(): 显式补一句 state.difficulty = calculateDifficulty(0)，消除依赖「下一帧 step」的隐式自愈窗口，让重开后的状态立刻自洽，而非依赖时序。
- src/game/loop.ts: 当前循环只有难度刷新、生成、移动，没有任何得分累加/通过管道判定的逻辑；若得分递增不在他处实现，难度曲线将永不爬升。建议明确得分来源并补充通过管道 +1 的钩子。
- src/config/difficulty.ts: DIFFICULTY_CONFIG 及其旋钮做了 Object.freeze，但 calculateDifficulty 返回的 DifficultyResult 是普通可变字面量，与配置层不可变风格不一致，可考虑冻结返回值或明确注释其可变语义。
- src/game/spawner.ts: spawnPipe 只存 gap 与 gapCenterY，未派生上下管道边界（gapCenterY ± gap/2），碰撞与渲染需各自重复换算；建议在 Pipe 上直接给出 top/bottom 或提供派生函数。
- src/game/mover.ts: movePipes 形参声明为 readonly Pipe[] 却对元素 pipe.x 原地改写，readonly 仅约束数组结构不约束元素属性，语义上易被误读为「不修改」，建议在 JSDoc 明确「只读数组引用、原地改元素」或改回 Pipe[]。

## 审查的代码
- openspec/changes/c-66b492/tasks.md
- docs/Reqs/32500b/66b492/dev-notes.md
