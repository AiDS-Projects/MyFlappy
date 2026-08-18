已修复。两个文件此前都被误写入了上一轮会话的回复文本：

- `src/config/difficulty.ts` — 整段被替换成中文说明，已恢复为正确的 `DIFFICULTY_CONFIG` 常量表代码
- `src/config/constants.ts` — 文件头部混入了回复文本（`已修复。原文件混入了…`），已剔除，只保留常量本体

`difficulty.ts` 依赖 `constants.ts` 导出的 `MIN_GAP_HEIGHT`，所以两者必须一起修复才能编译。测试 16/16 通过。

`src/config/difficulty.ts` 完整内容：

```typescript
import type { DifficultyConfig } from "./difficulty.types";
import { MIN_GAP_HEIGHT } from "./constants";

/**
 * 难度参数唯一常量源（config-driven difficulty layer）。
 *
 * 集中定义三个难度旋钮的初始值 / 变化速率 / 上下限：
 * - pipeSpeed:      管道移动速度（px/s），随分数线性上升，max 为反应极限
 * - gapHeight:      开口间距（px），随分数线性收窄，min 为「鸟碰撞盒 + 安全边距」理论可通过下限
 * - spawnInterval:  管道生成间隔（s），随分数线性缩短，min 保证玩家有足够反应时间
 *
 * 调平衡只需改这一处，禁止在游戏逻辑里散落魔法数字。
 * 顶层与嵌套对象均用 Object.freeze 冻结，配合 readonly 类型防止运行时意外改写。
 */
export const DIFFICULTY_CONFIG: DifficultyConfig = Object.freeze({
  /** 管道移动速度，单位 px/s */
  pipeSpeed: Object.freeze({
    initial: 2.0,
    ratePerScore: 0.02,
    min: 2.0,
    max: 4.0,
  }),
  /** 开口间距，单位 px */
  gapHeight: Object.freeze({
    initial: 160,
    ratePerScore: -1.0,
    min: MIN_GAP_HEIGHT,
    max: 160,
  }),
  /** 管道生成间隔，单位 s */
  spawnInterval: Object.freeze({
    initial: 1.8,
    ratePerScore: -0.01,
    min: 0.8,
    max: 1.8,
  }),
});
```