/**
 * DIFFICULTY_CONFIG 单元测试 — 不变量断言 + 封顶分数计算。
 *
 * 对齐 code-review 验收标准（docs/Reqs/32500b/39e0d4/code-review.md）：
 * 1. 不变量：initial ∈ [min, max]、min < max、ratePerScore 符号与旋钮方向一致；
 * 2. 封顶分数：pipeSpeed / gapHeight / spawnInterval 到达极限的分数（100 / 60 / 100）；
 * 3. 物理边界：gapHeight.min 必须由 MIN_GAP_HEIGHT 推导，杜绝魔法数字漂移。
 *
 * 运行：bun test tests/config/difficulty.test.ts
 */
import { describe, expect, test } from "bun:test";
import { DIFFICULTY_CONFIG } from "../../src/index";
import type { DifficultyParam } from "../../src/index";
import {
  BIRD_COLLISION_HEIGHT,
  GAP_SAFE_MARGIN,
  MIN_GAP_HEIGHT,
} from "../../src/config";

/**
 * 计算旋钮到达极限（封顶 / 触底）所需的分数。
 *
 * 线性难度曲线 value = initial + ratePerScore * score：
 * - 递增旋钮（ratePerScore > 0）在 value 到达 max 时封顶；
 * - 递减旋钮（ratePerScore < 0）在 value 到达 min 时触底。
 *
 * 封顶分数 = (极限值 - initial) / ratePerScore。
 */
function capScore(param: DifficultyParam): number {
  const limit = param.ratePerScore > 0 ? param.max : param.min;
  return (limit - param.initial) / param.ratePerScore;
}

describe("DIFFICULTY_CONFIG 不变量", () => {
  const knobs: ReadonlyArray<{ name: string; param: DifficultyParam }> = [
    { name: "pipeSpeed", param: DIFFICULTY_CONFIG.pipeSpeed },
    { name: "gapHeight", param: DIFFICULTY_CONFIG.gapHeight },
    { name: "spawnInterval", param: DIFFICULTY_CONFIG.spawnInterval },
  ];

  for (const { name, param } of knobs) {
    describe(name, () => {
      test("min < max，上下限顺序合法", () => {
        expect(param.min).toBeLessThan(param.max);
      });

      test("initial 落在 [min, max] 区间内", () => {
        expect(param.initial).toBeGreaterThanOrEqual(param.min);
        expect(param.initial).toBeLessThanOrEqual(param.max);
      });

      test("ratePerScore 为非零有限数", () => {
        expect(Number.isFinite(param.ratePerScore)).toBe(true);
        expect(param.ratePerScore).not.toBe(0);
      });
    });
  }

  test("ratePerScore 符号与旋钮方向一致", () => {
    // pipeSpeed 随分数递增；gapHeight / spawnInterval 随分数递减
    expect(DIFFICULTY_CONFIG.pipeSpeed.ratePerScore).toBeGreaterThan(0);
    expect(DIFFICULTY_CONFIG.gapHeight.ratePerScore).toBeLessThan(0);
    expect(DIFFICULTY_CONFIG.spawnInterval.ratePerScore).toBeLessThan(0);
  });

  test("初始值位于最宽松端（score=0 即无压力基线）", () => {
    // 递增旋钮初始在 min；递减旋钮初始在 max
    expect(DIFFICULTY_CONFIG.pipeSpeed.initial).toBe(
      DIFFICULTY_CONFIG.pipeSpeed.min,
    );
    expect(DIFFICULTY_CONFIG.gapHeight.initial).toBe(
      DIFFICULTY_CONFIG.gapHeight.max,
    );
    expect(DIFFICULTY_CONFIG.spawnInterval.initial).toBe(
      DIFFICULTY_CONFIG.spawnInterval.max,
    );
  });

  test("顶层与嵌套对象均已冻结，防止运行时改写", () => {
    expect(Object.isFrozen(DIFFICULTY_CONFIG)).toBe(true);
    expect(Object.isFrozen(DIFFICULTY_CONFIG.pipeSpeed)).toBe(true);
    expect(Object.isFrozen(DIFFICULTY_CONFIG.gapHeight)).toBe(true);
    expect(Object.isFrozen(DIFFICULTY_CONFIG.spawnInterval)).toBe(true);
  });

  test("gapHeight.min 由物理边界常量推导，保证理论可通过", () => {
    expect(DIFFICULTY_CONFIG.gapHeight.min).toBe(MIN_GAP_HEIGHT);
    expect(MIN_GAP_HEIGHT).toBe(BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2);
  });
});

describe("DIFFICULTY_CONFIG 封顶分数", () => {
  test("pipeSpeed 在 score=100 封顶", () => {
    expect(capScore(DIFFICULTY_CONFIG.pipeSpeed)).toBe(100);
  });

  test("gapHeight 在 score=60 触底", () => {
    expect(capScore(DIFFICULTY_CONFIG.gapHeight)).toBe(60);
  });

  test("spawnInterval 在 score=100 封顶", () => {
    expect(capScore(DIFFICULTY_CONFIG.spawnInterval)).toBe(100);
  });
});
