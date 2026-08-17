# 架构设计 - 建立难度参数配置常量表

## 架构模式
config-driven-difficulty-layer（配置驱动的难度常量层）

## 技术栈

- **language**: TypeScript
- **framework**: React 18+（前端组件，与项目 web-dev.md 规则一致）
- **build**: Vite
- **runtime**: 浏览器 Canvas / 游戏循环
- **new_dependencies**: 无（纯常量 + 类型，不引入新包）
- **module_scope**: frontend

## 模块设计

### DifficultyParam
职责: 

### DifficultyConfig
职责: 

### DIFFICULTY_CONFIG
职责: 

### difficulty constants barrel
职责: 

## 关键决策
- 采用统一三元组 {initial, ratePerScore, min, max} 描述每个旋钮，三个旋钮（速度/间距/间隔）共用同一 schema，降低后续曲线计算与调平衡的心智成本
- 参数集中为单一 Object.freeze 常量对象 DIFFICULTY_CONFIG，禁止在游戏逻辑里散落魔法数字，调平衡只需改一处
- 用 TypeScript readonly + as const 保证配置只读，防止运行时意外改写导致难度失控
- 本任务只交付配置常量与类型，曲线计算逻辑独立成下一模块（config 保持纯数据、无逻辑），符合增量设计与职责分离
- 初始基线采用线性变化（ratePerScore），保证「平滑上升无明显跳变」；如需 ease-out 等非线性曲线，属于曲线模块职责，配置层不预埋，避免过度设计
- gapHeight/spawnInterval 的 min 显式标注为「必须可理论通过」的下限（鸟碰撞盒 + 安全边距），speed 的 max 为「反应极限」上限，直接对应验收标准
- 单位（px/s、px、s）写入字段注释与命名，避免间距用像素、速度用帧的混用
