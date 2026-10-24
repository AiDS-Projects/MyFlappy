/**
 * 游戏循环侧运行时常量（非难度旋钮）。
 *
 * 难度三旋钮（speed / gap / interval）的初值、上下限、速率均来自
 * `DIFFICULTY_CONFIG`，不在此处重复；此处仅定义与难度无关的单位换算
 * 与渲染层出生坐标，避免游戏循环内出现魔法数字。
 */

/** 秒 → 毫秒换算因子（`step(dt)` 的 dt 以秒为单位，生成计时以 ms 累加） */
export const MS_PER_SECOND = 1000;

/** 管道生成时的水平出生位置（px），位于屏幕右缘外 */
export const PIPE_SPAWN_X = 480;

/** 管道开口中心默认纵坐标（px），属于生成位置维度，不参与难度计算 */
export const PIPE_GAP_CENTER_Y = 300;
