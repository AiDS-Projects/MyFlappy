已修复 `src/config/constants.ts`，剔除了第 1-6 行的遗留回复文本和第 39-41 行的 `---` 及附注，仅保留常量本体（4 个导出常量 + 头部注释）。

另外确认：`src/config/difficulty.ts` 当前内容已是干净的合法 TypeScript（第 1 行 `import type`，无污染），无需改动。