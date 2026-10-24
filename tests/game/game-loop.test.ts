/**
 * 游戏循环难度消费与重开重置单元测试。
 *
 * 覆盖验收点：
 *  5.1 score=0 帧难度等于初始值（200 / 180 / 1600）
 *  5.2 得分递增后帧难度实时刷新且方向正确
 *  5.3 生成调度：interval 随得分缩短且不越下限 800
 *  5.4 新管道开口间距等于实时 gap 且不越下限 110
 *  5.5 管道移动位移等于 speed * dt 且 speed 不越上限 340
 *  5.6 重开：得分归零、首帧难度等于初始值
 *  5.7 确定性：连续两局相同得分难度逐项相等
 *
 * 运行：bun test tests/game/game-loop.test.ts
 */
import { describe, expect, test } from "bun:test";
import {
  calculateDifficulty,
  createGameState,
  movePipes,
  pipeDisplacement,
  restart,
  shouldSpawnPipe,
  spawnPipe,
  step,
} from "../../src/index";
import type { GameState } from "../../src/index";

/** 便捷：创建已进入「playing」阶段的游戏状态 */
function playingState(score = 0): GameState {
  const state = createGameState(score);
  state.phase = "playing";
  return state;
}

describe("5.1 每帧按得分刷新难度", () => {
  test("score=0 时帧难度等于初始值（200 / 180 / 1600）", () => {
    const state = playingState(0);
    step(state, 0.016);
    expect(state.difficulty).toEqual({ speed: 200, gap: 180, interval: 1600 });
    expect(state.difficulty).toEqual(calculateDifficulty(0));
  });
});

describe("5.2 得分递增难度实时刷新", () => {
  test("得分变化后帧难度等于 calculateDifficulty(n+1)，且方向正确", () => {
    const state = playingState(0);
    step(state, 0.016);
    const before = state.difficulty;

    state.score = 10;
    step(state, 0.016);

    expect(state.difficulty).toEqual(calculateDifficulty(10));
    expect(state.difficulty.speed).toBeGreaterThanOrEqual(before.speed);
    expect(state.difficulty.gap).toBeLessThanOrEqual(before.gap);
    expect(state.difficulty.interval).toBeLessThanOrEqual(before.interval);
  });

  test("非 playing 阶段不移动不生成但仍刷新难度", () => {
    const state = createGameState();
    state.score = 30;
    step(state, 1.0);
    expect(state.difficulty).toEqual(calculateDifficulty(30));
    expect(state.pipes.length).toBe(0);
    expect(state.elapsedSinceSpawn).toBe(0);
  });
});

describe("5.3 生成调度", () => {
  test("累计计时达到 interval 才生成，interval 随得分缩短且不越下限 800", () => {
    const state = playingState(0);
    // 1.5s = 1500ms < 初始 interval 1600ms，不生成
    step(state, 1.5);
    expect(state.pipes.length).toBe(0);

    // 再累计 0.1s → 1600ms，生成一组
    step(state, 0.1);
    expect(state.pipes.length).toBe(1);

    // 得分 40 时 interval 已钳制到下限 800
    state.score = 40;
    step(state, 0.8);
    expect(state.pipes.length).toBe(2);
    expect(state.difficulty.interval).toBe(800);
    expect(state.difficulty.interval).toBeGreaterThanOrEqual(800);
  });

  test("shouldSpawnPipe 以实时 interval 判定生成时机", () => {
    const low = calculateDifficulty(0);
    const high = calculateDifficulty(100000);
    expect(shouldSpawnPipe(low.interval - 1, low)).toBe(false);
    expect(shouldSpawnPipe(low.interval, low)).toBe(true);
    expect(shouldSpawnPipe(high.interval, high)).toBe(true);
  });
});

describe("5.4 新管道开口间距", () => {
  test("开口间距等于实时 gap 且不越下限 110", () => {
    const state = playingState(20);
    step(state, 1.7); // 20 分时 interval=1200ms，1.7s 触发一次生成
    expect(state.pipes.length).toBeGreaterThanOrEqual(1);

    const pipe = state.pipes[0];
    expect(pipe.gap).toBe(state.difficulty.gap);
    expect(pipe.gap).toBe(calculateDifficulty(20).gap);
    expect(pipe.gap).toBeGreaterThanOrEqual(110);

    // 极限得分下 gap 钳制到下限 110
    expect(calculateDifficulty(100000).gap).toBe(110);
  });

  test("spawnPipe 使用实时 difficulty.gap", () => {
    const d = calculateDifficulty(20);
    const pipe = spawnPipe(480, d, 300);
    expect(pipe.gap).toBe(d.gap);
    expect(pipe.gap).toBeGreaterThanOrEqual(110);
  });
});

describe("5.5 管道移动", () => {
  test("位移量等于 speed * dt 且 speed 不越上限 340", () => {
    const d = calculateDifficulty(100000);
    expect(d.speed).toBe(340);

    const dt = 0.016;
    const pipe = spawnPipe(480, d, 300);
    const startX = pipe.x;
    movePipes([pipe], d, dt);

    expect(pipeDisplacement(d, dt)).toBe(d.speed * dt);
    expect(pipe.x).toBeCloseTo(startX - d.speed * dt, 9);
    expect(d.speed).toBeLessThanOrEqual(340);
  });

  test("step 内管道按当前帧 speed 左移", () => {
    const state = playingState(0);
    step(state, 1.7); // 生成一根管道
    expect(state.pipes.length).toBe(1);
    const pipe = state.pipes[0];
    const xBefore = pipe.x;

    state.score = 10;
    const dt = 0.016;
    step(state, dt);

    expect(pipe.x).toBeCloseTo(xBefore - calculateDifficulty(10).speed * dt, 9);
  });
});

describe("5.6 重开重置", () => {
  test("得分归零、清空管道与计时器，首帧难度等于初始值", () => {
    const state = playingState(50);
    step(state, 1.7); // 生成管道并计时
    expect(state.pipes.length).toBeGreaterThan(0);

    restart(state);
    expect(state.score).toBe(0);
    expect(state.pipes.length).toBe(0);
    expect(state.elapsedSinceSpawn).toBe(0);

    step(state, 0.016);
    expect(state.difficulty).toEqual(calculateDifficulty(0));
    expect(state.difficulty).toEqual({ speed: 200, gap: 180, interval: 1600 });
  });
});

describe("5.7 确定性", () => {
  test("连续两局相同得分下难度逐项相等", () => {
    const a = playingState();
    const b = playingState();
    const scores = [0, 5, 20, 35, 40, 100];

    for (const s of scores) {
      a.score = s;
      b.score = s;
      step(a, 0.016);
      step(b, 0.016);

      expect(a.difficulty.speed).toBe(b.difficulty.speed);
      expect(a.difficulty.gap).toBe(b.difficulty.gap);
      expect(a.difficulty.interval).toBe(b.difficulty.interval);
      expect(a.difficulty).toEqual(calculateDifficulty(s));
    }
  });

  test("createGameState 初始难度由 score 派生", () => {
    expect(createGameState(10).difficulty).toEqual(calculateDifficulty(10));
    expect(createGameState().difficulty).toEqual(calculateDifficulty(0));
  });
});
