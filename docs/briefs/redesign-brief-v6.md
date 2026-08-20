# 记事本 · 前端设计迭代 v6（在 notepad-redesign.html 上小修）

> 目标：修复 v5 hover 效果的**一处过渡瑕疵**，其余不动。

## 问题

`.card` 的基础 transition 目前只有 `transition: background var(--motion-fast) var(--ease-standard);`，导致 v5 新增的 hover 放大（scale 1.025）、阴影抬升、边框强调色**没有平滑过渡**，鼠标悬停时效果瞬间跳变，显得突兀。

## 修复要求

- `.card` 的 transition 增加 `transform`、`box-shadow`、`border-color`（以及 `border-width` 若用到），时长与现有动效体系一致：hover 相关用 `var(--motion-base) var(--ease-standard)`（约 220ms 平滑），保持 Apple 的减速曲线手感
- hover 进入/离开都要平滑（离开时同样渐变回原状）
- 其余任何代码不动，视觉风格不变

## 验收

- [ ] hover 放大/阴影/边框 200ms 左右平滑过渡，无跳变
- [ ] 移开鼠标平滑还原
- [ ] 深浅主题一致
