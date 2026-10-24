/**
 * 难度曲线计算模块（单一事实来源）。
 *
 * 基于分数与三旋钮难度常量表（pipeSpeed / gapHeight / spawnInterval），
 * 按线性规则计算并做边界钳制，返回当前「速度 / 开口间距 / 生成间隔」。
 *
 * 单位契约：
 *  - speed     px/s
 *  - gap       px
 *  - interval  ms
 *
 * 游戏逻辑统一 `import { calculateDifficulty } from "@/config"` 引用，
 * 禁止在管道移动 / 生成逻辑中散落魔法数字。
 */

import { MIN_GAP_HEIGHT } from "./constants";
import type { DifficultyConfig, DifficultyParam } from "./difficulty.types";

export type { DifficultyConfig, DifficultyParam } from "./difficulty.types";

/** 难度曲线计算结果（平铺三元组） */
export interface DifficultyResult {
  /** 管道移动速度，单位 px/s */
  readonly speed: number;
  /** 管道开口间距，单位 px */
  readonly gap: number;
  /** 管道生成间隔，单位 ms */
  readonly interval: number;
}

/** 将单个旋钮配置冻结为不可变对象 */
function frozenParam(
  initial: number,
  ratePerScore: number,
  min: number,
  max: number,
): DifficultyParam {
  return Object.freeze({ initial, ratePerScore, min, max });
}

/**
 * 内置默认难度常量表（三旋钮 schema）。
 *
 * 数值以 PRD 验收基准为权威：
 *  - pipeSpeed：     200 → 340（每 1 分 +4）
 *  - gapHeight：     180 → 110（每 1 分 -2，下限由 MIN_GAP_HEIGHT 推导）
 *  - spawnInterval： 1600 → 800（每 1 分 -20）
 *
 * 顶层与各旋钮对象均 `Object.freeze`，保证运行期不可变。
 */
export const DIFFICULTY_CONFIG: Readonly<DifficultyConfig> = Object.freeze({
  pipeSpeed: frozenParam(200, 4, 200, 340),
  gapHeight: frozenParam(180, -2, MIN_GAP_HEIGHT, 180),
  spawnInterval: frozenParam(1600, -20, 800, 1600),
});

/** 将数值截断到 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 分数归一化：负数 / NaN / undefined / 非有限数统一归一为 0。
 * 其余数值原样返回（不做取整，保持纯计算语义）。
 */
export function normalizeScore(score: unknown): number {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    return 0;
  }
  return score;
}

/**
 * 计算指定分数下的难度曲线取值。
 *
 * 线性模型 + 边界钳制：
 *  - speed    = clamp(initial + ratePerScore * score, min, max)
 *  - gap      = clamp(initial + ratePerScore * score, min, max)
 *  - interval = clamp(initial + ratePerScore * score, min, max)
 *
 * 对 speed 向上钳制到上限；gap / interval 因 ratePerScore 为负，同一 clamp
 * 即实现向下钳制到下限。config 缺省时回退内置默认常量表，保证调用不崩溃。
 *
 * 旋钮映射：speed ← pipeSpeed、gap ← gapHeight、interval ← spawnInterval。
 */
export function calculateDifficulty(
  score?: number,
  config?: DifficultyConfig,
): DifficultyResult {
  const value = normalizeScore(score);
  const c = config ?? DIFFICULTY_CONFIG;

  const speed = clamp(
    c.pipeSpeed.initial + c.pipeSpeed.ratePerScore * value,
    c.pipeSpeed.min,
    c.pipeSpeed.max,
  );
  const gap = clamp(
    c.gapHeight.initial + c.gapHeight.ratePerScore * value,
    c.gapHeight.min,
    c.gapHeight.max,
  );
  const interval = clamp(
    c.spawnInterval.initial + c.spawnInterval.ratePerScore * value,
    c.spawnInterval.min,
    c.spawnInterval.max,
  );

  return { speed, gap, interval };
}
