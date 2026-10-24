# 开发笔记 — 建立难度参数配置常量表

> 2026-10-24 16:57 | LLM

## 产出文件
- [src/config/difficulty.ts](/app#repo?file=src/config/difficulty.ts) (3482 chars)
- [src/config/index.ts](/app#repo?file=src/config/index.ts) (417 chars)

## 自测: 自测 5/6 通过 ⚠️

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 2 个文件 |
| 入口文件 | ❌ | 缺少 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 2 个文件已落盘 |

## 代码变更 (Diff)

### src/config/difficulty.ts (修改)
```diff
--- a/src/config/difficulty.ts
+++ b/src/config/difficulty.ts
@@ -1,37 +1,149 @@
-import type { DifficultyConfig } from "./difficulty.types";

-import { MIN_GAP_HEIGHT } from "./constants";

+/**

+ * 难度参数配置常量表（单一事实来源）。

+ *

+ * 将随分数变化的难度相关参数集中于此，统一提供：

+ *  - 初始值（initial）：score = 0 时的取值；

+ *  - 随分数变化速率（rate）：每 1 分的增量，可为负（表示随分数递减）；

+ *  - 下限（min）/ 上限（max）：难度曲线计算结果的边界。

+ *

+ * 后续难度曲线模块通过 computeDifficultyValue / computeDifficulty 引用本表，

+ * 避免在场景 / 生成逻辑中散落硬编码的难度数值。

+ */

+

+// ---------------------------------------------------------------------------

+// 类型定义

+// ---------------------------------------------------------------------------

+

+/** 难度参数标识（与 DIFFICULTY_CONFIG 的 key 一一对应） */

+export type DifficultyParamKey =

+  | 'obstacleSpeed'

+  | 'spawnIntervalMs'

+  | 'maxObstacles'

+  | 'hazardDamage'

+  | 'maxFallSpeed';

+

+/** 单个难度参数的配置项 */

+export interface DifficultyParamConfig {

+  /** 参数标识 */

+  readonly key: DifficultyParamKey;

+  /** 参数名称（调试 / 日志展示用） */

+  readonly label: string;

+  /** 单位（文档用，如 px/s、ms、个、点） */

+  readonly unit: string;

+  /** 初始值（score = 0 时的取值） */

+  readonly initial: number;

+  /** 随分数变化速率：每 1 分的增量（可为负） */

+  readonly rate: number;

+  /** 下限（计算结果不会低于此值） */

+  readonly min: number;

+  /** 上限（计算结果不会高于此值） */

+  readonly max: number;

+}

+

+/** 全量难度参数在当前分数下的取值快照 */

+export type DifficultyValues = Record<DifficultyParamKey, number>;

+

... (共 186 行变更)
```

### src/config/index.ts (无变化)
