/**
 * 管道移动。
 *
 * 所有已生成与后续生成的管道统一消费同帧 `difficulty.speed` 水平左移：
 * `x -= speed * dt`（dt 以秒为单位）。速度值不在此处出现任何硬编码数字。
 */
import type { DifficultyResult } from "../config";
import type { Pipe } from "./types";

/**
 * 单帧水平位移量 = 实时 `speed * dt`（px）。
 *
 * @param difficulty 当前帧难度快照（取 `speed`，单位 px/s）
 * @param dt 帧间隔（秒）
 */
export function pipeDisplacement(
  difficulty: DifficultyResult,
  dt: number,
): number {
  return difficulty.speed * dt;
}

/**
 * 将所有管道按实时 `speed` 水平左移。
 *
 * @param pipes 待移动的管道（原地修改 `x`）
 * @param difficulty 当前帧难度快照（取 `speed`）
 * @param dt 帧间隔（秒）
 */
export function movePipes(
  pipes: readonly Pipe[],
  difficulty: DifficultyResult,
  dt: number,
): void {
  const dx = pipeDisplacement(difficulty, dt);
  for (const pipe of pipes) {
    pipe.x -= dx;
  }
}
