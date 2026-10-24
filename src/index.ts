/**
 * 项目根入口文件（root entry / barrel）。
 *
 * 统一导出难度常量表与难度曲线计算函数：
 *  - `DIFFICULTY_CONFIG`：三旋钮难度默认常量表（单一事实来源）；
 *  - `calculateDifficulty`：基于分数与常量表计算当前速度 / 开口间距 / 生成间隔。
 *
 * 下游模块（管道移动 / 生成逻辑）统一从此处导入，避免散落到 config 内部路径。
 */
export { DIFFICULTY_CONFIG, calculateDifficulty } from "./config";
export type {
  DifficultyParam,
  DifficultyConfig,
  DifficultyResult,
} from "./config";

// 游戏侧 API（状态 / 主循环 / 管道生成 / 管道移动），供根入口统一消费。
export * from "./game";
