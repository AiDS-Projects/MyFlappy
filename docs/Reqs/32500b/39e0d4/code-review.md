# 代码审查 — 建立难度参数配置常量表

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'level': 'critical', 'file': 'src/index.ts', 'title': '根入口 barrel 未 re-export 物理常量，破坏文档声明的「统一引用入口」契约', 'description': "src/config/index.ts 显式导出了 BIRD_COLLISION_WIDTH / BIRD_COLLISION_HEIGHT / GAP_SAFE_MARGIN / MIN_GAP_HEIGHT，但 src/index.ts 只 re-export 了 DIFFICULTY_CONFIG 和两个类型。src/index.ts 自己的 docstring 声明其是「下游模块的统一引用入口」并要求下游 `import from 'src/index'` 而非 config 内部路径。任何遵循该契约、需要读取 MIN_GAP_HEIGHT（gapHeight.min 的直接依赖）或碰撞盒尺寸的下游模块（如碰撞检测、难度曲线计算）从根入口导入都会直接编译失败。两处 barrel 出现不对称导出，属于功能性缺陷。", 'suggestion': "在 src/index.ts 中补齐常量 re-export：`export { BIRD_COLLISION_WIDTH, BIRD_COLLISION_HEIGHT, GAP_SAFE_MARGIN, MIN_GAP_HEIGHT } from './config';`，或明确声明常量只允许从 '@/config' 内部路径引用并删除 config/index.ts 中的导出，避免两处不一致。"}

## 🟡 警告（建议修复）
- {'level': 'warning', 'file': 'src/config/difficulty.ts', 'title': '魔法数字仍然内联，与「禁止散落魔法数字」的注释自相矛盾', 'description': '注释声称「调平衡只需改这一处，禁止在游戏逻辑里散落魔法数字」，但 2.0 / 0.02 / 4.0 / 160 / -1.0 / 1.8 / -0.01 / 0.8 这些数值本身仍是无推导、无依据的内联字面量。集中化只解决了「位置分散」，没解决「值为何如此」。max=4.0 为什么是反应极限？ratePerScore=0.02 的依据是什么？后续调平衡者无法判断这些值的安全边界。', 'suggestion': '为每个数值补充推导依据（how/why 注释）或将派生关系抽成可读表达式，例如标注 4.0 = 屏幕宽度 / 反应时间、0.02 来自目标分数-速度曲线等。'}
- {'level': 'warning', 'file': 'src/config/difficulty.ts', 'title': 'min/max 语义被重载且单调旋钮一侧边界为死字段', 'description': 'DifficultyParam 用同一对 min/max 承载了三种不同物理含义：pipeSpeed.min=2.0 是「速度下限」（ratePerScore 为正、速度只增，此边界永远不可达）；gapHeight.max=160、spawnInterval.max=1.8 是「初始值」（rate 为负、只减不增，同样永远不可达）。三个旋钮都存在一侧边界等于 initial 且因 rate 单调而成为死配置，阅读 min/max 时无法判断它是「可通过下限」「反应上限」还是「起始值」。', 'suggestion': '要么移除单调方向的死边界，要么在类型上区分语义（如 startLimit/endLimit 或单独的 passableMin/reactionMax 字段），并在模块加载时断言非死字段。'}
- {'level': 'warning', 'file': 'src/config/difficulty.ts', 'title': '缺少 min <= initial <= max 不变量校验', 'description': '配置没有任何运行时或编译期断言保证 initial 落在 [min, max] 区间。若未来调平衡把 initial 改成 5.0 而 max 仍为 4.0，或把 min 改到大于 initial，难度曲线模块的 clamp 会产生静默错误结果，且无任何报错提示。', 'suggestion': '模块加载时对每个 DifficultyParam 执行 `assert(min <= initial && initial <= max && min <= max)`，或在测试中覆盖该不变量。'}
- {'level': 'warning', 'file': 'src/config/constants.ts', 'title': 'BIRD_COLLISION_WIDTH 被定义并导出但未被引用', 'description': 'BIRD_COLLISION_WIDTH = 40 已定义且从 config/index.ts 导出，但 MIN_GAP_HEIGHT 仅使用 BIRD_COLLISION_HEIGHT，任何已展示代码均未消费宽度值，属于死导出/死代码。同时 constants.ts 只以文字描述形式给出，无法验证是否同样做了 Object.freeze 或 as const 冻结。', 'suggestion': '确认宽度是否被后续碰撞模块使用；若暂无消费者则先不导出，或补齐实际使用点，避免误导。'}
- {'level': 'warning', 'file': 'src/config/difficulty.types.ts', 'title': '单位仅存在于注释，类型系统不携带单位信息', 'description': 'px/s、px、s 这些单位只写在 JSDoc 里，DifficultyParam 用裸 number 表达。任何下游模块都可能把「管道速度」当作 px/frame 或把「间隔」当作 ms 传入，编译器无法拦截单位错配，是隐式的跨模块契约风险。', 'suggestion': "考虑品牌化类型（如 `type PxPerSecond = number & { __unit: 'px/s' }`）或在字段命名中显式带单位（pipeSpeedPxPerSec / spawnIntervalSec）。"}

## 🟢 建议（可选优化）
- {'level': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': '用 as const + satisfies 替代双层 Object.freeze', 'description': '当前手动 Object.freeze 外层 + 每个嵌套对象再 freeze，写法啰嗦且只覆盖到两层；若未来某个旋钮内部新增嵌套对象，容易漏冻结。同时显式注解 DifficultyConfig 后丢失了字面量类型。', 'suggestion': '改用 `export const DIFFICULTY_CONFIG = {...} as const satisfies DifficultyConfig;` 获得编译期字面量只读，或封装一个 deepFreeze 工具函数统一处理任意深度。'}
- {'level': 'suggestion', 'file': 'src/config/constants.ts', 'title': 'GAP_SAFE_MARGIN 命名未体现「双侧」语义', 'description': 'MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2 中的 `* 2` 表示上、下两侧各留 30px，但 GAP_SAFE_MARGIN 单看名字会被理解为「总安全边距」，容易让人误以为应写成 +30 而非 +60。', 'suggestion': '重命名为 GAP_SAFE_MARGIN_PER_SIDE（或 SIDE_MARGIN）使 `* 2` 自解释，并在注释中写明「上侧+下侧」。'}
- {'level': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': '缺少测试覆盖', 'description': '全局编码准则要求新增逻辑配测试。当前没有针对配置模块的测试来验证：MIN_GAP_HEIGHT 计算为 100、三个旋钮的 min<=initial<=max 不变量、Object.freeze 冻结是否生效（运行时写入会静默失败还是抛错）。', 'suggestion': '新增 difficulty.test.ts / constants.test.ts，断言常量值、不变量以及冻结行为。'}
- {'level': 'suggestion', 'file': 'src/config/difficulty.ts', 'title': '数值推导依据缺失，建议补充 why 级注释', 'description': '全局规则要求复杂/关键参数给出 why 注释。当前注释只描述字段含义（what），未解释 4.0、0.02、-1.0、-0.01 这些关键平衡数值的推导过程，后续调平衡难以判断改动是否安全。', 'suggestion': '在 DIFFICULTY_CONFIG 上方补充一段说明，标注各数值来源（如反应时间假设、目标难度曲线斜率、碰撞盒+边距推导）。'}

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
