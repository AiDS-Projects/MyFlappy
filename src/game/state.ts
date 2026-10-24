/**
 * 游戏状态创建与重开重置。
 *
 * 难度是 `score` 的派生值：`createGameState` 依据初始得分派生难度；
 * `restart` 仅将 `score` 归零并清空管道 / 生成计时器，下一帧 `step`
 * 调用 `calculateDifficulty(0)` 即自然恢复初始难度，无需手写
 * 「恢复初始值」分支，杜绝「得分与难度双源」漂移。
 */
import { calculateDifficulty } from "../config";
import type { GameState } from "./types";

/**
 * 创建游戏初始状态。
 *
 * @param score 初始得分，默认 0；难度三元组由 `calculateDifficulty(score)` 派生。
 */
export function createGameState(score = 0): GameState {
  return {
    score,
    phase: "ready",
    difficulty: calculateDifficulty(score),
    pipes: [],
    elapsedSinceSpawn: 0,
  };
}

/**
 * 重开重置：得分归零、清空管道与生成计时器，回到「再来一局」的初始态。
 *
 * 不在此处改写难度三元组——由下一帧 `step` 依据 score=0 重新派生，
 * 保证「重开第一帧 = score 0 = 初始难度」的强一致。
 */
export function restart(state: GameState): void {
  state.score = 0;
  state.phase = "ready";
  state.pipes.length = 0;
  state.elapsedSinceSpawn = 0;
}
