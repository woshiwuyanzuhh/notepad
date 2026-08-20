# AGENTS.md — 记事本项目进度与开发指南

> 本文件是项目当前状态与继续开发的**唯一入口**。新会话先读本文件再动手。
> 最后更新：2026-08-20（当前会话上下文已满，换会话继续）

## 一、项目是什么

**记事本** —— 一个本地优先的个人 Windows 桌面笔记应用，苹果设计风格。
- **技术栈**：Tauri 2（Rust 后端）+ Vue 3 + Vite + CodeMirror 6 + markdown-it + highlight.js + KaTeX
- **形态**：纯文件存储——每篇笔记一个 `.md` / `.txt` 文件，数据完全本地
- **仓库**：`D:\deepseekharness\记事本`（git 已初始化，remote = https://github.com/woshiwuyanzuhh/notepad，**公开**）
- **安装包**：`src-tauri\target\release\bundle\nsis\记事本_0.1.0_x64-setup.exe`（已装到 `C:\Users\lenovo\AppData\Local\记事本\`）

## 二、当前完成状态（全部可用）

### 功能清单
1. **多工作目录（库）**：设置/标题栏/侧栏可添加、切换、移除多个笔记文件夹（Rust config `data_dirs`）
2. **智能视图**：全部笔记 / 收藏 / 最近编辑 / 文件夹 / 标签 / 回收站；列表/网格双视图；排序（修改时间/标题/字数）
3. **文件夹树**：展开显示笔记文件（MD 蓝徽章 / TXT 绿徽章），点击打开、右键菜单
4. **标签管理**：+ 添加、✎ 内联编辑（全局同步）、✕ 删除（确认后全笔记移除）；卡片右键"设置标签"面板（勾选+新建）
5. **右键菜单（App 逻辑）**：仅笔记列表/侧栏文件/文件夹/空白区弹出，其余区域无浏览器右键；卡片/文件菜单含：重新命名（内联输入）、设置标签、卡片颜色（7 色板+清除）、果冻动画开关、收藏、置顶、删除
6. **卡片效果**：hover 放大（scale 1.025 + 阴影抬升 + 蓝边框）、点击果冻动画（单卡可关）、颜色自定义
7. **编辑器**：CodeMirror 6（代码块自动缩进、Markdown 高亮）、编辑/分栏/预览三模式、格式工具条（H1/加粗/斜体/引用/代码块/行内代码/链接/图片插入）、txt 用纯文本模式 + 自动换行开关
8. **Markdown 预览**：苹果文稿排版、代码块高亮（5 语言）+ 复制按钮、LaTeX（KaTeX）、任务列表、本地图片（复制到 assets/）
9. **JSON 工具**：检测到 JSON 自动浮现工具条（格式化/校验/树状查看——右侧抽屉，嵌套可折叠树）
10. **搜索**：标题/正文/标签实时过滤 + 命中高亮（Ctrl+K 聚焦）
11. **状态栏**：右下角实时字数、保存状态（绿点/黄点）、文件类型、txt 换行开关
12. **主题**：浅色/深色（苹果蓝 #0071e3 单一强调色），持久化
13. **首启欢迎页**：选择/打开笔记文件夹；**设置弹窗**（外观/编辑器字体字号/txt 换行/库管理/关于）
14. **快捷键**：Ctrl+N 新建、Ctrl+S 保存、Ctrl+W 关标签、Ctrl+Tab 切换、Ctrl+K 搜索、Esc 退出纯净模式/关菜单
15. **健壮性**：自动保存（900ms 防抖）、外部修改冲突检测（覆盖/重新加载）、路径安全、无边框窗口（右上角窗口控制）
16. **安装**：NSIS 安装包 3.5MB，桌面快捷方式 + 开始菜单项（静默安装自动创建桌面快捷方式）

### 测试状态
- 前端 Vitest：**46/46 通过**（`pnpm test`）
- Rust：**33 通过**（`cargo test`，src-tauri 目录下）
- `pnpm build` / `pnpm tauri build` 均通过；clippy 零警告

## 三、架构速览

```
src/                    # 前端 Vue 3（JavaScript，无 TS）
├── components/         # TitleBar/Sidebar/NoteList/EditorArea/ContextMenu/SettingsModal/WelcomeOverlay/JsonTree/JsonNode/Icon/IconSprite/EditorPane/PreviewPane
├── lib/                # api.js(invoke 封装) / markdown.js / json-tools.js / search.js / utils.js / notes.js / __tests__/
├── styles/main.css     # 设计稿全套 CSS（54KB+补丁），组件用全局类名（非 scoped 为主）
└── store.js            # 全局响应式状态 + 全部动作
src-tauri/              # Rust 后端
├── src/commands.rs     # 全部命令：get_config/set_data_dir/remove_data_dir/list_notes/read_note/write_note/create_note/rename_note/set_note_meta/rename_tag/delete_tag/delete_note/list_trash/restore_note/purge_note/search/import_image/list_fonts
├── src/fsx.rs meta.rs store.rs search.rs
└── tests/              # 5 个集成测试文件
docs/
├── design/notepad-redesign.html   # OpenDesign 设计稿 v6（最终参考）
├── design/notepad-prototype.html  # v1 设计稿（含完整预览排版 CSS 可参考）
├── briefs/             # 各版本设计需求书（v1-v6）
└── plans/ manual-smoke.md
```

**关键约定**：
- 界面类名以设计稿 v6（notepad-redesign.html）为准；**组件用全局类名**（main.css 定义了），scoped 只用于组件私有小样式
- 图标：IconSprite.vue 注入 SVG symbols，Icon.vue 用 `<use href="#i-xxx">`（49 个图标名见 sprite）
- 状态全部在 store.js 的 reactive store，组件直接读写

## 四、最近修复的关键问题（避免重犯）

1. **WebView2 缓存导致"旧界面"**：多次重装后浏览器缓存旧 CSS/JS → 排版混乱、功能"消失"。**用户报告界面异常时，先清缓存**：关应用 → 删 `%LOCALAPPDATA%\com.personal.notepad\EBWebView` → 重开。
2. **设计稿 v6 CSS 不完整**：OpenDesign 迭代会遗漏旧样式（如预览排版/代码高亮色/JSON 树/tab 内部类）。移植时必须**逐类核对**设计稿 CSS 与组件类名（检查脚本：`D:\deepseekharness\OpenDesign\scripts\check-classes.cjs`、`check-design-classes.cjs`、`check-css-gap.cjs`）。
3. **标签页类名**：设计稿是 `.t-name/.t-dot/.t-close/.t-type.md|txt`（不是 .tab-title/.tab-dot/.tab-x）；卡片摘要 `.card-ex`（不是 .card-sum）。
4. **编辑器白屏 bug（已修）**：CodeMirror 用 Compartment 动态切换语言/换行（不重建 view）；所有编辑操作前检查 `view.destroyed`。切勿退回"destroy+重建"方案。
5. **PowerShell 传参给 node -e 中文/引号会损坏**：复杂脚本一律写成 .js/.cjs 文件再执行。

## 五、遗留问题 / 下一步

1. **用户最近反馈"界面乱"**——已定位并修复（CSS 缺失 + 类名不匹配 + 缓存），**待用户确认新安装版效果**。若仍乱，让用户提供截图文件路径，用能读图的模型（当前 deepseek-v4-flash 不支持图片）查看。
2. 卡片 hover 与果冻动画、网格视图等**尚未在真实使用中充分验证**（程序化检查通过）。
3. 排序菜单、网格视图、最近编辑视图为移植实现，与设计稿细节可能有偏差。
4. 可考虑：笔记互链、更多排序选项、导出备份（用户早期提过，暂未做）。

## 六、环境信息

- **OpenDesign**（设计引擎）：web http://127.0.0.1:59624 / daemon 59623；dsh 引擎通过 `D:\deepseekharness\OpenDesign\bin\dsh.cmd`；设计项目 `design-mt0vncll`（conversation 47dba14c-afd3-4dab-94b8-c97b6baf604a）——迭代设计用 `D:\deepseekharness\OpenDesign\scripts\trigger-run2.js <brief路径> <projectId> <conversationId>`
- **启动 OpenDesign**：PATH 加 `D:\deepseekharness\OpenDesign\node\node2415\...;node24\...;OpenDesign\bin` 后 `pnpm tools-dev start web --web-port 59624 --daemon-port 59623`（在 repo/open-design 下）
- **GitHub 凭据**：Git Credential Manager 缓存（username woshiwuyanzuhh）
- **Rust**：stable-msvc 1.97（`C:\Users\lenovo\.cargo\bin`）
- 用户数据目录：`C:\Users\lenovo\Desktop\简历`（有真实笔记；应用 config 在 `%APPDATA%\notepad\config.json`）

## 七、常用命令

```bash
# 前端
pnpm test                 # Vitest
pnpm build                # vite build
# 后端（cd src-tauri）
cargo test
cargo clippy
# 开发/打包
pnpm tauri dev            # 开发（可用 WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333 开调试）
pnpm tauri build          # 打包 NSIS
# git
git add -A && git commit -m "..." && git push
```

## 八、CDP 调试脚本（OpenDesign/scripts/）

- `cdp-inspect.mjs`：检查界面结构/右键菜单/功能
- `cdp-layout.mjs`：布局/重叠/深色/DPI 检查
- `cdp-final.mjs`：最终功能验证
- `check-classes.cjs`：组件类名 vs CSS 定义对比
- `check-design-classes.cjs` / `check-css-gap.cjs`：设计稿类名核对
- 用法：启动应用带 `--remote-debugging-port=9444`，node 运行脚本
