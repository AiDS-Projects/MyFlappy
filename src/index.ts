/**
 * 项目根入口文件（root entry / barrel）。
 *
 * 本项目当前交付物为「难度参数配置常量表」：将所有难度相关参数
 * （管道速度 / 开口间距 / 生成间隔）集中到统一配置常量 DIFFICULTY_CONFIG 中，
 * 每个旋钮包含 {initial, ratePerScore, min, max}，供后续难度曲线计算模块引用。
 *
 * 本文件同时作为测试 harness 的入口检查项，并充当下游模块的统一引用入口：
 * 后续新增模块（如难度曲线计算）时在此追加 re-export，游戏逻辑统一
 * `import { DIFFICULTY_CONFIG } from "src/index"`，避免散落到 config 内部路径。
 */
export { DIFFICULTY_CONFIG } from "./config";
export type { DifficultyParam, DifficultyConfig } from "./config";