/**
 * 游戏侧模块统一出口（barrel）。
 *
 * 下游消费方统一 `import { ... } from "@/game"` 引用游戏状态 / 主循环 /
 * 管道生成 / 管道移动 API，避免散落到 `src/game` 内部路径。
 */
export { MS_PER_SECOND, PIPE_GAP_CENTER_Y, PIPE_SPAWN_X } from "./constants";
export { step } from "./loop";
export { movePipes, pipeDisplacement } from "./mover";
export { shouldSpawnPipe, spawnPipe } from "./spawner";
export { createGameState, restart } from "./state";
export type { GamePhase, GameState, Pipe } from "./types";
