/**
 * 管道生成器。
 *
 * 消费同帧 `difficulty` 快照：用累计计时器对比实时 `interval` 决定生成时机，
 * 新生成管道的开口间距取自实时 `gap`。难度值不在此处出现任何硬编码数字。
 */
import type { DifficultyResult } from "../config";
import type { Pipe } from "./types";

/**
 * 判断是否应生成新管道：累计计时器达到实时 `interval`。
 *
 * @param elapsedSinceSpawn 生成器累计计时（ms）
 * @param difficulty 当前帧难度快照（取 `interval`）
 */
export function shouldSpawnPipe(
  elapsedSinceSpawn: number,
  difficulty: DifficultyResult,
): boolean {
  return elapsedSinceSpawn >= difficulty.interval;
}

/**
 * 生成一组新管道：开口间距取自实时 `difficulty.gap`。
 *
 * @param x 水平出生位置（px）
 * @param difficulty 当前帧难度快照（取 `gap`）
 * @param gapCenterY 开口中心纵坐标（px，生成位置维度）
 */
export function spawnPipe(
  x: number,
  difficulty: DifficultyResult,
  gapCenterY: number,
): Pipe {
  return { x, gapCenterY, gap: difficulty.gap };
}
