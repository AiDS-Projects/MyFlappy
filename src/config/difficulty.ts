已恢复 `src/config/difficulty.ts` 为正确的 TypeScript 常量表代码，移除了上一轮会话残留的回复文本。`constants.ts` 内容本身已是正确代码，无需改动。

`difficulty.ts` 现在导入 `DifficultyConfig` 类型与 `MIN_GAP_HEIGHT` 常量，导出 `DIFFICULTY_CONFIG` 三个难度旋钮（`pipeSpeed` / `gapHeight` / `spawnInterval`），顶层与嵌套对象均用 `Object.freeze` 冻结，与原设计一致。