`需要的改动` 部分为空，没有可执行的增量改动。经核对，当前 `src/config/constants.ts` 已完整实现任务背景「建立难度参数配置常量表」的全部内容，且同步接线均已就位：

- `difficulty.ts:27` 的 `gapHeight.min` 已引用 `MIN_GAP_HEIGHT`（消除硬编码 100），`difficulty.ts:2` 已 import；
- `index.ts:7-12` barrel 已导出 `BIRD_COLLISION_WIDTH / BIRD_COLLISION_HEIGHT / GAP_SAFE_MARGIN / MIN_GAP_HEIGHT`。

因此无任何删减或叠加，文件维持现状。修改后的完整文件内容如下：

/**
 * 物理边界常量唯一源（physics boundary constants）。
 *
 * 消除两类魔法数字漂移：
 * 1. gapHeight.min 硬编码断言 —— 此前 gapHeight.min 直接写死为 100，
 *    与小鸟碰撞盒尺寸无关联。一旦碰撞盒高度 + 安全边距超过该值，
 *    难度封顶后管道开口将物理上无法通过，游戏不可继续。
 *    现将 min 改为由本文件的 MIN_GAP_HEIGHT 推导，保证「理论可通过」。
 * 2. 碰撞盒尺寸漂移 —— 小鸟碰撞检测矩形宽高散落在游戏逻辑多处，
 *    各处数值可能不一致。现将宽高收敛到 BIRD_COLLISION_WIDTH / HEIGHT 唯一来源。
 *
 * 本文件为纯常量、无逻辑。任何依赖物理边界的配置（如 DIFFICULTY_CONFIG.gapHeight.min）
 * 与游戏逻辑必须引用此处的导出，禁止再写死数值。
 */

/** 小鸟碰撞盒宽度，单位 px（碰撞检测矩形宽，非视觉 sprite 宽） */
export const BIRD_COLLISION_WIDTH = 40;

/** 小鸟碰撞盒高度，单位 px（碰撞检测矩形高，非视觉 sprite 高） */
export const BIRD_COLLISION_HEIGHT = 40;

/** 小鸟通过管道开口时，上下两侧各需保留的最小安全边距，单位 px */
export const GAP_SAFE_MARGIN = 30;

/**
 * 管道开口最小可通过高度（px）= 碰撞盒高度 + 上下安全边距 × 2。
 *
 * 作为 DIFFICULTY_CONFIG.gapHeight.min 的唯一来源：碰撞盒尺寸或安全边距调整时，
 * 此处自动同步，杜绝「碰撞盒 + 边距」与 min 值分别维护导致的漂移。
 */
export const MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2;

---

如需我在此基础上继续添加具体改动（例如新增某类常量），请补充「需要的改动」内容，我再做增量修改。