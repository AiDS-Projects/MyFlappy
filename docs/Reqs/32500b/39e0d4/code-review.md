# 代码审查 — 建立难度参数配置常量表

## 评分: 2/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/config/difficulty.ts', 'line': 1, 'title': '文件内容损坏，DIFFICULTY_CONFIG 常量定义完全缺失', 'detail': '该文件当前内容是上一轮会话的回复文本（\'The file is corrupted — it contains the previous session\'s response text...\' 及后续中文说明），而非 TypeScript 代码。它未定义也未导出 DIFFICULTY_CONFIG，而 config/index.ts 的 `export { DIFFICULTY_CONFIG } from "./difficulty"` 和 src/index.ts 的 `export { DIFFICULTY_CONFIG } from "./config"` 都依赖此导出。结果：模块解析失败，整个项目无法编译，难度参数配置常量表这一核心交付物实际上并不存在。必须恢复真实的 DIFFICULTY_CONFIG 定义（含 pipeSpeed / gapHeight / spawnInterval 三旋钮的 {initial, ratePerScore, min, max} 取值）。', 'level': 'critical'}
- {'file': 'src/config/constants.ts', 'line': 1, 'title': '文件头部混入非注释的说明文字，导致语法错误', 'detail': '文件第 1 行起是 \'已修复。原文件混入了上一轮说明性文字（第 1-6 行的分析、第 40 行的 ---、第 42 行的"如需我…"），现只保留常量本体。\' 这段裸文本，其后才接 `/** 物理边界常量唯一源... */` 注释块。裸文本不是合法 TypeScript 语法，解析器会在文件顶部直接报错。该文件即使依赖关系正确也无法被 import。需删除第 1 段会话性文字，仅保留注释与常量本体。', 'level': 'critical'}

## 🟡 警告（建议修复）
- {'file': 'src/config/difficulty.types.ts', 'line': 1, 'title': 'DifficultyParam 类型契约缺少取值合法性约束', 'detail': '类型仅声明了 initial/ratePerScore/min/max 四个 readonly number，但没有约束 initial 必须落在 [min, max] 区间内、min < max、以及 ratePerScore 符号与方向一致（如 gapHeight 为负步进）。纯类型声明无法防止后续调平衡时写入非法配置（例如 min=120 而 initial=100，或 min > max）。建议在 DIFFICULTY_CONFIG 定义处增加编译期断言（如 satisfies 辅助类型）或运行时校验，确保每个旋钮 min <= initial <= max。', 'level': 'warning'}
- {'file': 'src/config/constants.ts', 'line': 20, 'title': 'MIN_GAP_HEIGHT 硬编码 `GAP_SAFE_MARGIN * 2`，隐含对称边距假设', 'detail': 'MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2 中的 `* 2` 假定上下边距相等且对称。若未来因小鸟姿态（俯冲/上升时上下所需安全空间不同）需不对称边距，则需改动该公式本身而非仅改常量值，属于隐式耦合。建议显式拆分 GAP_SAFE_MARGIN_TOP / GAP_SAFE_MARGIN_BOTTOM，或在注释中明确说明对称性假设不可破坏。', 'level': 'warning'}
- {'file': 'src/config/constants.ts', 'line': 8, 'title': 'BIRD_COLLISION_WIDTH 已导出但未参与任何常量推导', 'detail': "当前常量推导链仅 BIRD_COLLISION_HEIGHT 参与 MIN_GAP_HEIGHT 计算，BIRD_COLLISION_WIDTH 虽被导出但在此文件中无下游引用。若游戏碰撞检测代码尚未切换到该导出，宽高仍可能散落在别处以各自数值维护，违背 docstring 中'宽高收敛到唯一来源'的目标。需确认游戏逻辑已改为引用该常量，否则宽度仍存在漂移风险。", 'level': 'warning'}

## 🟢 建议（可选优化）
- {'file': 'src/config/constants.ts', 'line': 1, 'title': 'docstring 混入会话性叙述，应精简为纯技术说明', 'detail': "docstring 中'消除两类魔法数字漂移'的说明本身很好，但'已修复/原文件混入上一轮说明性文字'等属于会话过程记录，不应进入源码注释。恢复时应只保留技术性 why 注释，会话信息可放入 commit message 或 PR 描述。", 'level': 'suggestion'}
- {'file': 'src/config/constants.ts', 'line': 17, 'title': 'GAP_SAFE_MARGIN 注释可更明确对称性假设', 'detail': "'上下两侧各需保留的最小安全边距' 未明确说明上下边距取同一值这一假设。建议改为 GAP_SAFE_MARGIN_TOP / GAP_SAFE_MARGIN_BOTTOM 两个常量，或在此注释中显式写明'上下对称，同一值'，避免后续维护者误认为可分别调整。", 'level': 'suggestion'}
- {'file': 'src/config/difficulty.ts', 'line': 1, 'title': '恢复 DIFFICULTY_CONFIG 时需补充各旋钮取值的推导依据', 'detail': "因文件损坏无法审查各 {initial, ratePerScore, min, max} 的实际取值。恢复时应为每个旋钮补充 why 级别注释（例如 pipeSpeed 上限如何对应'反应极限'、gapHeight 下限如何对应 MIN_GAP_HEIGHT），否则仅有一组裸数值难以维护和调平衡。", 'level': 'suggestion'}
- {'file': 'src/config/constants.ts', 'line': 20, 'title': 'MIN_GAP_HEIGHT 计算结果建议显式注释', 'detail': "MIN_GAP_HEIGHT = 40 + 30*2 = 100。原注释提到'此前 gapHeight.min 直接写死为 100'，说明历史值恰好等于新推导值。建议在注释中明确'当前推导结果为 100'，便于读者快速核对迁移前后数值一致性，避免误以为发生了行为变更。", 'level': 'suggestion'}

## 审查的代码
- src/config/difficulty.ts
- src/config/constants.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
