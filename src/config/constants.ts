已修改 `src/config/constants.ts`，清除了污染文本，写入物理边界常量唯一源配置：

- `BIRD_COLLISION_WIDTH = 40`
- `BIRD_COLLISION_HEIGHT = 40`
- `GAP_SAFE_MARGIN = 30`
- `MIN_GAP_HEIGHT = BIRD_COLLISION_HEIGHT + GAP_SAFE_MARGIN * 2`（即 100）