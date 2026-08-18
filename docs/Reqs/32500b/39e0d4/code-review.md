# 代码审查 — 建立难度参数配置常量表

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- src/config/difficulty.ts 核心交付文件内容缺失：diff 部分为 agent 拒绝响应文本而非实际代码（「需要的改动」为空），导致无法验证 Object.freeze 是否真正调用、gapHeight.min 是否实际引用 MIN_GAP_HEIGHT、封顶分数 100/60/100 是否与 {initial, ratePerScore, min, max} 一致。「16 个测试全部通过」无法被审查确认；若实现落地为 as const/readonly 而非 Object.freeze，冻结测试必然失败。变更完整性不满足可审查要求，属于交付级严重问题。
- tests/config/difficulty.test.ts 冻结断言与类型设计存在逻辑冲突：difficulty.types.ts 全字段声明为 readonly（编译期约束），而测试用 Object.isFrozen 做运行时断言。TS 惯用的 as const + satisfies DifficultyConfig 不会冻结运行时对象，等价行为会被测试误判为失败。测试过度绑定具体实现技术（Object.freeze）而非行为契约（不可变），属于测试正确性问题。

## 🟡 警告（建议修复）
- tsconfig.json include 仅含 src，tests/ 被排除在 tsc --noEmit 之外；bun test 只转译不检查类型，导致测试代码完全脱离 strict 与「禁止 any」类型约束，测试中的类型错误不会被 CI 捕获。
- tests/config/difficulty.test.ts capScore 使用浮点除法后用 toBe(100) 精确相等断言：对非整除步长（如 ratePerScore=0.3）会产生浮点误差导致脆弱失败；且 ratePerScore===0 时除零产生 Infinity/NaN，虽另有非零断言但函数自身缺乏防御。
- src/config/constants.ts 中 GAP_SAFE_MARGIN = 30 本身是未文档化的魔法数字：全文件目标是「消除魔法数字漂移」，但 30 无任何推导来源（无重力/拍打冲量/手感测试依据），与文件宣称的目标自相矛盾。
- MIN_GAP_HEIGHT = 40 + 30*2 = 100 与旧硬编码 100 数值完全一致，属同义改写：重构只换了表达式未改值。若游戏逻辑仍各自硬编码碰撞盒尺寸，则「唯一来源」声明不成立，漂移风险依旧存在，需确认下游已接入这些常量。

## 🟢 建议（可选优化）
- src/config/constants.ts 导出的 BIRD_COLLISION_WIDTH 全项目无引用（difficulty.ts 仅使用 MIN_GAP_HEIGHT），疑似死导出；建议接入游戏碰撞逻辑或移除。
- src/index.ts 经 ./config barrel 二次转发 DIFFICULTY_CONFIG 与类型，多一层间接；建议直接 from ./config/difficulty 与 ./config/difficulty.types 减少跳转层级。
- tsconfig.json paths 的 @/* 别名仅配置 TS 解析，运行期需 bundler（Vite/Webpack）同步配置 alias，否则 @/config 运行时解析失败；建议补充说明或统一改用相对路径。
- difficulty.types.ts 中 min 注释写「gapHeight / spawnInterval 必须设为『理论可通过』的最小值」，但 spawnInterval（生成间隔）与「可通过」物理无关，注释语义不准确，应拆分说明。
- capScore 函数未对 ratePerScore === 0 显式守卫（仅靠外部测试断言）；建议函数内对零速率抛出明确错误或返回语义化结果，避免调用方误用产生 Infinity/NaN。

## 审查的代码
- src/index.ts
- tsconfig.json
- src/config/constants.ts
- tests/config/difficulty.test.ts
- src/config/difficulty.ts
- docs/Reqs/32500b/39e0d4/dev-notes.md
