/**
 * 物理边界常量（单一事实来源）。
 *
 * 集中定义小鸟碰撞盒与开口间距安全余量，难度曲线中的
 * `gapHeight.min` 由此处的 `MIN_GAP_HEIGHT` 推导，杜绝魔法数字漂移，
 * 保证最小开口间距「理论可通过」。
 *
 * 单位：px（像素）。
 */

/** 小鸟碰撞盒宽度（px），与小鸟精灵尺寸对齐 */
export const BIRD_COLLISION_WIDTH = 60;

/** 小鸟碰撞盒高度（px） */
export const BIRD_COLLISION_HEIGHT = 50;

/** 开口间距上下各保留的安全余量（px） */
export const GAP_SAFE_MARGIN = 30;

/**
 * 最小开口间距（px）= 碰撞盒高度 + 上下安全余量之和。
 * 保证管道开口下限不小于小鸟可穿越所需的最小空间。
 */
export const MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2;
