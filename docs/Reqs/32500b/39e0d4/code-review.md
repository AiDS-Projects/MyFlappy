# 代码审查 — 建立难度参数配置常量表

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- 类型契约自相矛盾：src/config/index.ts 从 ./difficulty 导出 DIFFICULTY_CONFIG（实际为 5 个参数 obstacleSpeed/spawnIntervalMs/maxObstacles/hazardDamage/maxFallSpeed，字段名为 rate），却从 ./difficulty.types.ts 导出 DifficultyConfig/DifficultyParam（3 个旋钮 pipeSpeed/gapHeight/spawnInterval，字段名为 ratePerScore）。两套 schema 完全脱节：下游按文档读 DIFFICULTY_CONFIG.pipeSpeed 会得到 undefined，按类型读 ratePerScore 会因常量里根本没有该字段而得到 undefined，最终参与运算产生 NaN。difficulty.types.ts 中的 DifficultyConfig 是无法描述实际常量的死类型，却作为公共 API 被 barrel 导出，违背『单一事实来源』。

## 🟡 警告（建议修复）
- Object.freeze 仅为浅冻结：只冻结了顶层对象，各参数配置对象（obstacleSpeed 等）在运行时仍可被修改（如 DIFFICULTY_CONFIG.obstacleSpeed.initial = 999），Readonly 类型只能拦编译期，无法保证运行期不可变性，『单一事实来源』名存实亡。
- maxObstacles 是计数参数，computeDifficultyValue 返回浮点数（2 + 0.01 * score，如 score=53 时为 2.53），计算层未做向下取整，依赖消费方记住『消费时向下取整』这一约定，生成逻辑易把 2.7 个障碍物当有效值使用。
- barrel 导出不完整：difficulty.ts 的注释明确声明『后续难度曲线模块通过 computeDifficultyValue / computeDifficulty 引用本表』，但 index.ts 仅导出了 DIFFICULTY_CONFIG，未导出 computeDifficulty、computeDifficultyValue、clamp、getDifficultyParam、DIFFICULTY_KEYS 以及 DifficultyParamKey/DifficultyParamConfig/DifficultyValues 类型，下游无法按文档从 @/config 引用这些 API。
- 单位契约冲突：difficulty.types.ts 中 spawnInterval 标注为『秒 (s)』，而实际常量 spawnIntervalMs 使用毫秒 (ms)，类型文档与实现单位不一致，后续计算模块极易引发 1000 倍量级误差。

## 🟢 建议（可选优化）
- 每个配置项内嵌的 key 字段与 Record 的 key 重复（如 obstacleSpeed.key === 'obstacleSpeed'），存在人为漂移风险，建议去掉自引用字段，改用 Object.entries 在需要时推导。
- DifficultyConfig 类型名与 DIFFICULTY_CONFIG 常量名高度相似，易混淆，建议将类型改名为 DifficultyConfigMap 或 DifficultySettings 以区分。
- 缺少运行时校验：未验证 initial 是否落在 [min, max] 区间（当前 5 项恰好都在区间内，但无任何保障），建议新增校验函数或单元测试。
- DIFFICULTY_KEYS 通过 Object.keys(...) as readonly DifficultyParamKey[] 强转，依赖运行期键插入顺序与类型断言，建议改为显式维护的数组并用 satisfies 关键字校验与 Record 的 key 一致。
- getDifficultyParam 的返回类型未反映可能缺失的情况，且未对未知 key 抛错，建议在运行时对缺失 key 抛出明确异常，避免静默返回 undefined。
- rate 的魔法数值（0.5 / -4 / 0.01 / 0.005 / 3）缺少来源说明或调平衡依据，建议补充数值出处注释或抽取为可单独调参的配置。

## 审查的代码
- src/config/difficulty.ts
- src/config/index.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
