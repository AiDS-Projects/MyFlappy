# 代码审查 — 实现随分数递增的难度曲线计算函数

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': '空指针崩溃：`const c = config ?? DIFFICULTY_CONFIG` 只处理了 config 为 undefined/null 的情况。当调用方传入「部分配置」（如仅含 pipeSpeed 的 { pipeSpeed: {...} }）时，`c.gapHeight.initial` / `c.spawnInterval.initial` 会抛出 TypeError: Cannot read properties of undefined。这直接违背了 JSDoc 中『config 缺省时回退内置默认常量表，保证调用不崩溃』的承诺。修复：对每个旋钮做 per-field 校验或与默认表做浅合并回退。'}

## 🟡 警告（建议修复）
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': '未做整数化处理：score 为小数（如 0.5、0.75）时会产生小数的 speed/gap/interval（如 interval=1585ms、gap=179px）。像素/毫秒级参数出现小数会导致亚像素渲染模糊，且非整数 ms 间隔可能破坏 setInterval/帧循环计时精度。建议对 gap、interval（及按需 speed）做 Math.round 后再返回。'}
- {'location': 'src/config/difficulty.ts:clamp', 'issue': 'clamp 未校验 min <= max。若自定义 config 中 min > max，`Math.min(max, Math.max(min, value))` 恒返回 max，静默产生错误结果。缺少运行时断言或边界校验。'}
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': 'NaN 污染：normalizeScore 只防御了 score，未防御 config 中的数值。若自定义 config 含 NaN（如 initial: NaN），Math.min/max 与 NaN 运算结果恒为 NaN，导致 speed/gap/interval 全部为 NaN 并污染游戏循环（渲染 NaN 坐标）。'}

## 🟢 建议（可选优化）
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': '重复代码：speed/gap/interval 三段 `clamp(x.initial + x.ratePerScore * value, x.min, x.max)` 完全同构，建议抽取 `computeParam(param: DifficultyParam, score: number): number` 消除重复。'}
- {'location': 'src/config/difficulty.ts:DIFFICULTY_CONFIG', 'issue': '魔法数字：200/4/340/180/-2/1600/-20/800 均为硬编码字面量，与模块『单一事实来源 / 杜绝魔法数字』的定位自相矛盾。建议提取命名常量（如 PIPE_SPEED_INITIAL、PIPE_SPEED_RATE 等）便于调平衡与可读性。'}
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': '返回对象未冻结：DifficultyResult 接口声明 readonly，但返回的 { speed, gap, interval } 运行期可变，与模块整体 Object.freeze 的不可变契约不一致。建议 Object.freeze 返回值以保持一致。'}
- {'location': 'src/config/difficulty.ts', 'issue': '缺少单元测试：normalizeScore 的边界（NaN、±Infinity、负数、undefined、字符串）与 clamp 边界钳制行为均无测试覆盖。该模块为纯函数、逻辑密集，按全局测试准则应补测试，尤其补『部分 config』与『min>max』两个缺陷的回归用例。'}
- {'location': 'src/config/difficulty.ts:calculateDifficulty', 'issue': '注释与实现耦合过紧：JSDoc 中『gap / interval 因 ratePerScore 为负』的描述仅在内置默认表下成立；若自定义 config 的 ratePerScore 为正，该描述即失效。建议描述为与符号无关的通用钳制语义。'}

## 审查的代码
- openspec/changes/c-12db8a/tasks.md
- docs/Reqs/32500b/12db8a/dev-notes.md
