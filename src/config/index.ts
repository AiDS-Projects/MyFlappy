/**
 * 难度配置模块统一出口（barrel）。
 * 游戏逻辑通过 `import { DIFFICULTY_CONFIG } from '@/config'` 引用常量，
 * 通过 `import type { DifficultyConfig, DifficultyParam } from '@/config'` 引用类型。
 */
export { DIFFICULTY_CONFIG } from "./difficulty";
export {
  BIRD_COLLISION_WIDTH,
  BIRD_COLLISION_HEIGHT,
  GAP_SAFE_MARGIN,
  MIN_GAP_HEIGHT,
} from "./constants";
export type { DifficultyParam, DifficultyConfig } from "./difficulty.types";
