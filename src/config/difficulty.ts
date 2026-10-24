/**
 * 难度参数配置常量表（单一事实来源）。
 *
 * 将随分数变化的难度相关参数集中于此，统一提供：
 *  - 初始值（initial）：score = 0 时的取值；
 *  - 随分数变化速率（rate）：每 1 分的增量，可为负（表示随分数递减）；
 *  - 下限（min）/ 上限（max）：难度曲线计算结果的边界。
 *
 * 后续难度曲线模块通过 computeDifficultyValue / computeDifficulty 引用本表，
 * 避免在场景 / 生成逻辑中散落硬编码的难度数值。
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 难度参数标识（与 DIFFICULTY_CONFIG 的 key 一一对应） */
export type DifficultyParamKey =
  | 'obstacleSpeed'
  | 'spawnIntervalMs'
  | 'maxObstacles'
  | 'hazardDamage'
  | 'maxFallSpeed';

/** 单个难度参数的配置项 */
export interface DifficultyParamConfig {
  /** 参数标识 */
  readonly key: DifficultyParamKey;
  /** 参数名称（调试 / 日志展示用） */
  readonly label: string;
  /** 单位（文档用，如 px/s、ms、个、点） */
  readonly unit: string;
  /** 初始值（score = 0 时的取值） */
  readonly initial: number;
  /** 随分数变化速率：每 1 分的增量（可为负） */
  readonly rate: number;
  /** 下限（计算结果不会低于此值） */
  readonly min: number;
  /** 上限（计算结果不会高于此值） */
  readonly max: number;
}

/** 全量难度参数在当前分数下的取值快照 */
export type DifficultyValues = Record<DifficultyParamKey, number>;

// ---------------------------------------------------------------------------
// 难度参数配置表
// ---------------------------------------------------------------------------

export const DIFFICULTY_CONFIG: Readonly<
  Record<DifficultyParamKey, DifficultyParamConfig>
> = Object.freeze({
  /** 危险区 / 障碍物水平移动速度（随分数加快） */
  obstacleSpeed: {
    key: 'obstacleSpeed',
    label: '障碍物速度',
    unit: 'px/s',
    initial: 60,
    rate: 0.5,
    min: 0,
    max: 320,
  },

  /** 障碍物生成间隔（随分数缩短，rate 为负） */
  spawnIntervalMs: {
    key: 'spawnIntervalMs',
    label: '障碍物生成间隔',
    unit: 'ms',
    initial: 2200,
    rate: -4,
    min: 500,
    max: 2200,
  },

  /** 场上同时存在的最大障碍物数量（随分数增多，约每 100 分 +1，消费时向下取整） */
  maxObstacles: {
    key: 'maxObstacles',
    label: '最大障碍物数量',
    unit: '个',
    initial: 2,
    rate: 0.01,
    min: 1,
    max: 8,
  },

  /** 危险区单次接触伤害（随分数上升） */
  hazardDamage: {
    key: 'hazardDamage',
    label: '危险区接触伤害',
    unit: '点',
    initial: 1,
    rate: 0.005,
    min: 1,
    max: 5,
  },

  /** 下落速度上限（随分数提高，rate 为正） */
  maxFallSpeed: {
    key: 'maxFallSpeed',
    label: '下落速度上限',
    unit: 'px/s',
    initial: 1400,
    rate: 3,
    min: 1400,
    max: 2800,
  },
});

/** 所有难度参数 key（按定义顺序，供遍历计算） */
export const DIFFICULTY_KEYS = Object.keys(
  DIFFICULTY_CONFIG,
) as readonly DifficultyParamKey[];

// ---------------------------------------------------------------------------
// 查询 / 计算辅助
// ---------------------------------------------------------------------------

/** 将数值截断到 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 按 key 获取单个难度参数配置 */
export function getDifficultyParam(
  key: DifficultyParamKey,
): DifficultyParamConfig {
  return DIFFICULTY_CONFIG[key];
}

/**
 * 计算指定难度参数在某分数下的取值。
 * 线性模型：initial + rate * score，并截断到 [min, max]。
 */
export function computeDifficultyValue(
  key: DifficultyParamKey,
  score: number,
): number {
  const { initial, rate, min, max } = DIFFICULTY_CONFIG[key];
  return clamp(initial + rate * score, min, max);
}

/** 一次性计算所有难度参数在某分数下的取值快照 */
export function computeDifficulty(score: number): DifficultyValues {
  const values = {} as DifficultyValues;
  for (const key of DIFFICULTY_KEYS) {
    values[key] = computeDifficultyValue(key, score);
  }
  return values;
}