/**
 * 游戏主循环。
 *
 * 每帧 `step(dt)`：
 *  1. 读取当前得分，调用 `calculateDifficulty(score)` 刷新 `difficulty`；
 *  2. 「playing」阶段累计生成计时并调度管道生成（消费实时 `interval`）；
 *  3. 所有管道消费同一帧 `difficulty.speed` 水平左移。
 *
 * 生成器与移动逻辑只读同帧 `state.difficulty` 快照，保证同帧一致；
 * 循环内不出现任何难度魔法数字，全部取自 `calculateDifficulty` 返回值。
 */
import { calculateDifficulty } from "../config";
import {
  MS_PER_SECOND,
  PIPE_GAP_CENTER_Y,
  PIPE_SPAWN_X,
} from "./constants";
import { movePipes } from "./mover";
import { shouldSpawnPipe, spawnPipe } from "./spawner";
import type { GameState } from "./types";

/**
 * 游戏主循环单帧更新。
 *
 * @param state 游戏状态（原地更新 `difficulty` / `pipes` / `elapsedSinceSpawn`）
 * @param dt 帧间隔（秒）；移动位移按 `speed * dt`，生成计时按 `dt * 1000` 换算为 ms
 */
export function step(state: GameState, dt: number): void {
  // 每帧刷新难度：即使得分未变也保持 difficulty 为最新派生值
  state.difficulty = calculateDifficulty(state.score);

  // 游戏结束 / 未开始阶段不执行移动与生成，避免残留帧
  if (state.phase !== "playing") {
    return;
  }

  // 生成调度：累计计时（ms）对比实时 interval，达标即生成并回拨计时器
  state.elapsedSinceSpawn += dt * MS_PER_SECOND;
  while (shouldSpawnPipe(state.elapsedSinceSpawn, state.difficulty)) {
    state.elapsedSinceSpawn -= state.difficulty.interval;
    state.pipes.push(
      spawnPipe(PIPE_SPAWN_X, state.difficulty, PIPE_GAP_CENTER_Y),
    );
  }

  // 移动：所有管道统一消费同帧 speed 快照
  movePipes(state.pipes, state.difficulty, dt);
}
