# 开发笔记 — 建立难度参数配置常量表

> 2026-08-17 14:33 | LLM

## 产出文件
- [src/config/difficulty.types.ts](/app#repo?file=src/config/difficulty.types.ts) (799 chars)
- [src/config/difficulty.ts](/app#repo?file=src/config/difficulty.ts) (864 chars)
- [src/config/index.ts](/app#repo?file=src/config/index.ts) (301 chars)

## 自测: 自测 5/6 通过 ⚠️

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 3 个文件 |
| 入口文件 | ❌ | 缺少 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 3 个文件已落盘 |

## 代码变更 (Diff)

### src/config/difficulty.types.ts (新建, 799 chars)
```
+ /**
+  * 单个难度参数的数据结构（统一三元组 schema）。
+  *
+  * 三个难度旋钮（管道速度 / 开口间距 / 生成间隔）共用此结构，
+  * 便于难度曲线计算模块与调平衡时以统一方式读写，避免各旋钮字段不一致。
+  */
+ export type DifficultyParam = {
+   /** 初始值（score = 0 时生效） */
+   readonly initial: number;
+   /**
+    * 每得 1 分的线性变化速率。
+    * - pipeSpeed 为正步进（随分数变快）
+    * - gapHeight 为负步进（随分数收窄）
+    * - spawnInterval 为负步进（随分数缩短）
+    */
+   readonly ratePerScore: number;
+   /** 下限（gapHeight / spawnInterval 必须设为「理论可通过」的最小值） */
+   readonly min: number;
+   /** 上限（pipeSpeed 必须设为「反应极限」上限，防止反应不及） */
+   readonly max: number;
+ ... (更多)
```

### src/config/difficulty.ts (新建, 864 chars)
```
+ import type { DifficultyConfig } from "./difficulty.types";
+ 
+ /**
+  * 难度参数唯一常量源（config-driven difficulty layer）。
+  *
+  * 集中定义三个难度旋钮的初始值 / 变化速率 / 上下限：
+  * - pipeSpeed:      管道移动速度（px/s），随分数线性上升，max 为反应极限
+  * - gapHeight:      开口间距（px），随分数线性收窄，min 为「鸟碰撞盒 + 安全边距」理论可通过下限
+  * - spawnInterval:  管道生成间隔（s），随分数线性缩短，min 保证玩家有足够反应时间
+  *
+  * 调平衡只需改这一处，禁止在游戏逻辑里散落魔法数字。
+  * 顶层与嵌套对象均用 Object.freeze 冻结，配合 readonly 类型防止运行时意外改写。
+  */
+ export const DIFFICULTY_CONFIG: DifficultyConfig = Object.freeze({
+   /** 管道移动速度，单位 px/s */
+   pipeSpeed: Object.freeze({
+     initial: 2.0,
+     ratePerScore: 0.02,
+     min: 2.0,
+     max: 4.0,
+ ... (更多)
```

### src/config/index.ts (新建, 301 chars)
```
+ /**
+  * 难度配置模块统一出口（barrel）。
+  * 游戏逻辑通过 `import { DIFFICULTY_CONFIG } from '@/config'` 引用常量，
+  * 通过 `import type { DifficultyConfig, DifficultyParam } from '@/config'` 引用类型。
+  */
+ export { DIFFICULTY_CONFIG } from "./difficulty";
+ export type { DifficultyParam, DifficultyConfig } from "./difficulty.types";
+ 
```
