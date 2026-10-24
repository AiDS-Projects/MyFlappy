/**
 * 静态断言：游戏循环 / 生成 / 移动源码无硬编码难度魔法数字。
 *
 * 难度初始值、上下限、速率必须来自 `DIFFICULTY_CONFIG` 或
 * `calculateDifficulty` 返回值。本测试直接读取 `src/game/` 源码，
 * 断言其中不含以下难度魔法数字的字面量：
 *   - speed 初始/下限 200、上限 340
 *   - gap 初始/上限 180、下限 110
 *   - interval 初始/上限 1600、下限 800
 *
 * 运行：bun test tests/game/no-magic-numbers.test.ts
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/** 需要断言无魔法数字的游戏侧源码文件 */
const SOURCE_FILES = [
  "loop.ts",
  "spawner.ts",
  "mover.ts",
  "state.ts",
  "types.ts",
  "constants.ts",
] as const;

/** 难度旋钮魔法数字（初值 / 上限 / 下限） */
const MAGIC_NUMBERS = [200, 180, 1600, 340, 110, 800] as const;

describe("游戏循环 / 生成 / 移动无硬编码难度魔法数字", () => {
  for (const file of SOURCE_FILES) {
    test(`${file} 不含难度魔法数字`, () => {
      const source = readFileSync(
        new URL(`../../src/game/${file}`, import.meta.url),
        "utf8",
      );
      for (const value of MAGIC_NUMBERS) {
        expect(source.match(new RegExp(`\\b${value}\\b`))).toBeNull();
      }
    });
  }
});
