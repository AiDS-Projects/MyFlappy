/**
 * 难度曲线计算单元测试。
 *
 * 覆盖 PRD 全部验收点：
 * 1. 常量表不变量（schema、冻结、物理边界推导）；
 * 2. score=0 默认基线；
 * 3. 边界分数（封顶/触底临界分数与超大分数）；
 * 4. 非法输入（负数 / NaN / undefined）归一为 0 且不抛异常；
 * 5. 单调性与无跳变；
 * 6. 不越界；
 * 7. config 缺省回退与自定义 config 即时生效。
 *
 * 运行：bun test tests/config/difficulty.test.ts
 */
import { describe, expect, test } from "bun:test";
import { DIFFICULTY_CONFIG, calculateDifficulty } from "../../src/index";
import type { DifficultyConfig, DifficultyParam } from "../../src/index";
import {
  BIRD_COLLISION_HEIGHT,
  GAP_SAFE_MARGIN,
  MIN_GAP_HEIGHT,
} from "../../src/config";

/** 计算旋钮到达极限（封顶 / 触底）所需的分数 */
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
    expect(DIFFICULTY_CONFIG.pipeSpeed.ratePerScore).toBeGreaterThan(0);
    expect(DIFFICULTY_CONFIG.gapHeight.ratePerScore).toBeLessThan(0);
    expect(DIFFICULTY_CONFIG.spawnInterval.ratePerScore).toBeLessThan(0);
  });

  test("初始值位于最宽松端（score=0 即无压力基线）", () => {
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
    expect(MIN_GAP_HEIGHT).toBe(110);
  });
});

describe("calculateDifficulty 默认基线", () => {
  test("score=0 返回 { speed: 200, gap: 180, interval: 1600 }", () => {
    expect(calculateDifficulty(0)).toEqual({
      speed: 200,
      gap: 180,
      interval: 1600,
    });
  });
});

describe("calculateDifficulty 边界分数", () => {
  test("speed 在封顶临界分数 35 到达上限，之后不再增长", () => {
    expect(capScore(DIFFICULTY_CONFIG.pipeSpeed)).toBe(35);
    expect(calculateDifficulty(34).speed).toBe(336);
    expect(calculateDifficulty(35).speed).toBe(340);
    expect(calculateDifficulty(36).speed).toBe(340);
  });

  test("gap 在触底临界分数 35 到达下限，之后不再收窄", () => {
    expect(capScore(DIFFICULTY_CONFIG.gapHeight)).toBe(35);
    expect(calculateDifficulty(34).gap).toBe(112);
    expect(calculateDifficulty(35).gap).toBe(110);
    expect(calculateDifficulty(36).gap).toBe(110);
  });

  test("interval 在触底临界分数 40 到达下限，之后不再缩短", () => {
    expect(capScore(DIFFICULTY_CONFIG.spawnInterval)).toBe(40);
    expect(calculateDifficulty(39).interval).toBe(820);
    expect(calculateDifficulty(40).interval).toBe(800);
    expect(calculateDifficulty(41).interval).toBe(800);
  });

  test("超大分数 100000 时全部钳制到极限", () => {
    expect(calculateDifficulty(100000)).toEqual({
      speed: 340,
      gap: 110,
      interval: 800,
    });
  });
});

describe("calculateDifficulty 非法输入归一为 0", () => {
  const baseline = calculateDifficulty(0);

  test("负数分数", () => {
    expect(calculateDifficulty(-5)).toEqual(baseline);
  });

  test("NaN 分数", () => {
    expect(calculateDifficulty(Number.NaN)).toEqual(baseline);
  });

  test("undefined 分数（不传参）", () => {
    expect(calculateDifficulty(undefined)).toEqual(baseline);
  });

  test("非有限数（Infinity）", () => {
    expect(calculateDifficulty(Number.POSITIVE_INFINITY)).toEqual(baseline);
  });

  test("不抛异常", () => {
    expect(() => calculateDifficulty(-5)).not.toThrow();
    expect(() => calculateDifficulty(Number.NaN)).not.toThrow();
    expect(() => calculateDifficulty(undefined)).not.toThrow();
  });
});

describe("calculateDifficulty 单调性与无跳变", () => {
  const range = 200;

  test("speed 单调不减且相邻差值 ≤ 速率 + 0.001", () => {
    const rate = DIFFICULTY_CONFIG.pipeSpeed.ratePerScore;
    let prev = calculateDifficulty(0).speed;
    for (let score = 1; score <= range; score++) {
      const cur = calculateDifficulty(score).speed;
      expect(cur).toBeGreaterThanOrEqual(prev);
      expect(cur - prev).toBeLessThanOrEqual(rate + 0.001);
      prev = cur;
    }
  });

  test("gap 单调不增且相邻差值 ≤ 速率 + 0.001", () => {
    const rate = Math.abs(DIFFICULTY_CONFIG.gapHeight.ratePerScore);
    let prev = calculateDifficulty(0).gap;
    for (let score = 1; score <= range; score++) {
      const cur = calculateDifficulty(score).gap;
      expect(cur).toBeLessThanOrEqual(prev);
      expect(prev - cur).toBeLessThanOrEqual(rate + 0.001);
      prev = cur;
    }
  });

  test("interval 单调不增且相邻差值 ≤ 速率 + 0.001", () => {
    const rate = Math.abs(DIFFICULTY_CONFIG.spawnInterval.ratePerScore);
    let prev = calculateDifficulty(0).interval;
    for (let score = 1; score <= range; score++) {
      const cur = calculateDifficulty(score).interval;
      expect(cur).toBeLessThanOrEqual(prev);
      expect(prev - cur).toBeLessThanOrEqual(rate + 0.001);
      prev = cur;
    }
  });
});

describe("calculateDifficulty 不越界", () => {
  const scores = [0, 1, 34, 35, 39, 40, 200, 100000];

  for (const score of scores) {
    test(`score=${score} 时 speed ≤ 340、gap ≥ 110、interval ≥ 800`, () => {
      const result = calculateDifficulty(score);
      expect(result.speed).toBeLessThanOrEqual(340);
      expect(result.gap).toBeGreaterThanOrEqual(110);
      expect(result.interval).toBeGreaterThanOrEqual(800);
    });
  }
});

describe("calculateDifficulty config 缺省与自定义", () => {
  test("config 缺失时使用内置默认常量表，不崩溃", () => {
    expect(calculateDifficulty(0)).toEqual({
      speed: 200,
      gap: 180,
      interval: 1600,
    });
  });

  test("自定义 config 即时生效", () => {
    const custom: DifficultyConfig = {
      pipeSpeed: {
        initial: 100,
        ratePerScore: 10,
        min: 100,
        max: 500,
      },
      gapHeight: {
        initial: 200,
        ratePerScore: -5,
        min: 120,
        max: 200,
      },
      spawnInterval: {
        initial: 2000,
        ratePerScore: -50,
        min: 900,
        max: 2000,
      },
    };

    // score=10：speed = 100 + 10*10 = 200；gap = 200 - 5*10 = 150；interval = 2000 - 50*10 = 1500
    expect(calculateDifficulty(10, custom)).toEqual({
      speed: 200,
      gap: 150,
      interval: 1500,
    });
  });
});
