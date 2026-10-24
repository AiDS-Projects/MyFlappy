/**
 * 游戏状态类型定义。
 *
 * `GameState` 是游戏循环侧的单一状态事实来源：集中持有 `score` 与由
 * `calculateDifficulty(score)` 派生的难度三元组 `difficulty`，生成器与
 * 移动逻辑只读同帧快照，避免多处重复计算产生不一致。
 */
import type { DifficultyResult } from "../config";

/** 游戏阶段 */
export type GamePhase = "ready" | "playing" | "gameover";

/** 管道（障碍物）描述 */
export interface Pipe {
  /** 管道左边缘水平位置（px） */
  x: number;
  /** 开口中心纵坐标（px），属于生成位置维度 */
  gapCenterY: number;
  /** 开口间距（px），生成时取自实时 `difficulty.gap` */
  gap: number;
}

/** 游戏状态：集中持有得分与派生难度三元组 */
export interface GameState {
  /** 当前得分（难度曲线的唯一输入） */
  score: number;
  /** 游戏阶段 */
  phase: GamePhase;
  /** 由 `score` 派生的当前帧难度三元组（speed / gap / interval） */
  difficulty: DifficultyResult;
  /** 已生成的管道 */
  pipes: Pipe[];
  /** 生成器累计计时（ms），对比实时 `difficulty.interval` 决定生成时机 */
  elapsedSinceSpawn: number;
}
