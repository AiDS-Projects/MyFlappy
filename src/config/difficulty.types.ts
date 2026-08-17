/**
 * 单个难度参数的数据结构（统一三元组 schema）。
 *
 * 三个难度旋钮（管道速度 / 开口间距 / 生成间隔）共用此结构，
 * 便于难度曲线计算模块与调平衡时以统一方式读写，避免各旋钮字段不一致。
 */
export type DifficultyParam = {
  /** 初始值（score = 0 时生效） */
  readonly initial: number;
  /**
   * 每得 1 分的线性变化速率。
   * - pipeSpeed 为正步进（随分数变快）
   * - gapHeight 为负步进（随分数收窄）
   * - spawnInterval 为负步进（随分数缩短）
   */
  readonly ratePerScore: number;
  /** 下限（gapHeight / spawnInterval 必须设为「理论可通过」的最小值） */
  readonly min: number;
  /** 上限（pipeSpeed 必须设为「反应极限」上限，防止反应不及） */
  readonly max: number;
};

/**
 * 汇总三个难度旋钮的配置对象类型。
 * 供 DIFFICULTY_CONFIG 常量与后续难度曲线计算模块引用。
 */
export type DifficultyConfig = {
  /** 管道移动速度，单位 px/s */
  readonly pipeSpeed: DifficultyParam;
  /** 开口间距，单位 px */
  readonly gapHeight: DifficultyParam;
  /** 管道生成间隔，单位 s */
  readonly spawnInterval: DifficultyParam;
};
