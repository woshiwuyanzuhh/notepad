# 记事本 Tauri 应用实施计划

> **For agentic workers:** 本计划在 DSH 会话内 inline 执行（当前会话已持有完整设计上下文；如需切换为 subagent-driven 可另起）。步骤用复选框（`- [ ]`）跟踪。

**Goal:** 将已批准的苹果风格前端设计稿（`docs/design/notepad-prototype.html`）实现为一个可安装的 Windows 桌面记事本应用（Tauri 2 + Vue 3），含本地文件存储、元数据、回收站、全文搜索、JSON 工具，最终打包为 NSIS 安装程序。

**Architecture:** 前端 Vue 3（Vite 构建）提供三栏界面与交互；后端 Rust 通过 Tauri command 暴露文件系统能力（笔记 .md 文件 + 隐藏 `.notebook-meta.json` 元数据 + `.trash` 回收站目录）。前端持有 reactive store（标签页/筛选/主题），所有持久化经 Rust commands。核心纯逻辑（JSON 工具、相对时间、搜索过滤）抽为可单测模块。

**Tech Stack:** Tauri 2 · Vue 3 · Vite · CodeMirror 6 · markdown-it · highlight.js · Vitest · Rust（serde/serde_json/tauri-plugin-dialog）· NSIS 打包

**Spec:** `docs/briefs/frontend-design-brief.md`（设计需求书）+ `docs/design/notepad-prototype.html`（已批准设计稿，视觉/交互以它为准）

## Global Constraints

- 界面语言：简体中文；UI 文案与设计稿一致（"记事本"、"全部笔记"、"已保存"等）
- 主题：浅色/深色两套完整实现，CSS variables 定义在 `:root` / `[data-theme="dark"]`，苹果蓝 #0071e3 为唯一强调色
- 存储：纯文件方案——每篇笔记一个 `.md`；元数据集中在数据目录下 `.notebook-meta.json`；回收站为 `.trash/` 子目录
- 数据目录：首次启动由用户选择并持久化（`%APPDATA%/notepad/config.json`），后续直接使用
- 路径安全：所有文件操作经 Rust 命令，路径必须位于数据目录内（拒绝 `..` 逃逸）
- 代码块：5 种语言高亮（Python/JS/JSON/HTML/Shell），编辑区内自动缩进
- 字体：系统栈 `-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif`，等宽 `SF Mono, Consolas, monospace`
- 依赖最小化：状态管理用 Vue reactive，不引入 Pinia；不用 TypeScript（用户偏好 JavaScript）
- 自动保存：输入停止 900ms 后保存（与设计稿一致）

---

### Task 0: 项目脚手架（create-tauri-app + 基础配置）

**Files:**
- Create: 整个 `D:\deepseekharness\记事本` 下的 Tauri 工程（`package.json`、`vite.config.js`、`index.html`、`src/`、`src-tauri/`）
- Modify: `src-tauri/tauri.conf.json`（窗口标题"记事本"、尺寸 1280×800、min 940×600、identifier `com.personal.notepad`）
- Modify: `src-tauri/Cargo.toml`（加入 tauri-plugin-dialog）
- Modify: `src-tauri/src/lib.rs`（注册插件与 commands 占位）
- Test: 无（脚手架验证 = 构建通过）

**Interfaces:**
- Produces: 可 `pnpm tauri dev` 启动的最小 Vue 3 窗口；`cargo check` 通过

- [ ] **Step 1:** 在 `D:\deepseekharness\记事本` 用 `pnpm create tauri-app@latest` 生成 vue（JavaScript）模板（name: notepad；管理器 pnpm）
- [ ] **Step 2:** 清掉模板演示代码（App.vue/Greet 命令），保留最小 `Hello 记事本` 页面
- [ ] **Step 3:** 改 `tauri.conf.json`（标题/尺寸/identifier）+ `Cargo.toml`（tauri-plugin-dialog）+ `lib.rs` 注册插件
- [ ] **Step 4:** 验证：`pnpm install` + `cargo check`（在 src-tauri）通过
- [ ] **Step 5:** `git init` 并提交 `feat: scaffold tauri+vue app`

---

### Task 1: 前端数据层（纯逻辑 + 单测）

**Files:**
- Create: `src/lib/utils.js`（相对时间、字数/行数、防抖、路径名解析、URL-safe 文件名）
- Create: `src/lib/json-tools.js`（JSON 检测/格式化/校验/树节点构建）
- Create: `src/lib/search.js`（本地过滤：按标题/正文/标签匹配 + 命中片段 + 高亮安全转义）
- Create: `src/lib/notes.js`（笔记模型归一化：`{path,title,folder,tags,star,pin,mtime,size,excerpt}`；从后端响应构造）
- Create: `src/lib/__tests__/utils.test.js`、`json-tools.test.js`、`search.test.js`、`notes.test.js`
- Test: Vitest（`pnpm vitest run`）

**Interfaces:**
- Produces: `relTime(ts)`、`countWords(text)`、`debounce(fn, ms)`、`basename(path)`、`safeFilename(title)`；`detectJson(text)`→`{kind:'full'|'fence', json, text, offset}|null`、`formatJson(text)`→`{ok,text}|{ok:false,error}`、`jsonToTree(json)`；`filterNotes(notes, q)`、`snippetOf(text, q)`、`escHtml(s)`；`normalizeNote(raw)`

- [ ] **Step 1:** 写四个测试文件（每个函数 2-4 个断言，含中文与边界：空文本、非法 JSON、跨行匹配）
- [ ] **Step 2:** `pnpm vitest run` 确认 FAIL（模块不存在）
- [ ] **Step 3:** 实现四个模块
- [ ] **Step 4:** `pnpm vitest run` 全绿
- [ ] **Step 5:** 提交 `feat: frontend data layer + tests`

---

### Task 2: 后端 Rust 存储层（文件 + 元数据 + 回收站 + 单测）

**Files:**
- Create: `src-tauri/src/commands.rs`（全部 Tauri commands 注册）
- Create: `src-tauri/src/store.rs`（数据目录解析、config 读写 `%APPDATA%/notepad/config.json`）
- Create: `src-tauri/src/meta.rs`（`.notebook-meta.json` 读写：notes 的 star/pin/tags/folder、trash 记录）
- Create: `src-tauri/src/fsx.rs`（路径安全校验 `ensure_inside(root, path)`、md 扫描、excerpt 提取）
- Create: `src-tauri/src/search.rs`（全文搜索：遍历 .md，返回 `{path, snippet}` 命中片段）
- Create: `src-tauri/tests/store_test.rs`、`meta_test.rs`、`fsx_test.rs`、`search_test.rs`
- Modify: `src-tauri/src/lib.rs`（invoke_handler 注册全部命令）
- Test: `cargo test`（用 `tempfile` 临时目录）

**Interfaces (Tauri commands, 全部 async):**
- `get_config() -> { data_dir: string|null }`
- `set_data_dir(path: string)`（校验可写；若旧目录存在则原样保留）
- `list_notes() -> Vec<NoteMeta>`（`{path,title,folder,tags,star,pin,mtime,size,excerpt}`，按 pin→mtime 排序）
- `read_note(path) -> { content: string, mtime: number }`
- `write_note(path, content: string)`
- `create_note(folder: string|null, title: string) -> string`（返回新路径；标题冲突自动加 `(2)`）
- `set_note_meta(path, star?: bool, pin?: bool, tags?: string[], folder?: string)`
- `delete_note(path)`（移入 `.trash/<name>`，meta 记录原路径）
- `list_trash() -> Vec<TrashEntry>`（`{name, original, deleted_at}`）
- `restore_note(name: string)`、`purge_note(name: string)`
- `search(q: string) -> Vec<{path, snippet}>`

- [ ] **Step 1:** 写 `fsx_test.rs`（路径逃逸拒绝、md 扫描、excerpt）与 `meta_test.rs`（读写/合并/trash 记录），跑 `cargo test` 确认 FAIL
- [ ] **Step 2:** 实现 `fsx.rs`、`meta.rs`、`store.rs`
- [ ] **Step 3:** 测试转绿；再写 `search_test.rs`（中文匹配、大小写、片段定位）实现 `search.rs`
- [ ] **Step 4:** 实现 `commands.rs`（全部命令）并注册到 `lib.rs`；`cargo check` 通过
- [ ] **Step 5:** 提交 `feat: rust storage layer + tests`

---

### Task 3: 应用骨架与三栏布局

**Files:**
- Create: `src/App.vue`（titlebar + 三栏布局 + 主题容器 + toast）
- Create: `src/store.js`（reactive：notes/tabs/active/filter/search/theme/rail/trash/config；动作：load、newNote、openNote、closeTab、save、delete、restore、toggleTheme 等；调用 Task 2 命令）
- Create: `src/components/TitleBar.vue`（交通灯、品牌图标+名称、搜索框、新建按钮、主题切换、设置弹窗）
- Create: `src/components/Sidebar.vue`（全部笔记/文件夹树/标签/回收站 + 折叠 rail 模式）
- Create: `src/components/NoteList.vue`（卡片：标题/摘要/相对时间/星标/置顶，选中态，悬停操作，搜索高亮）
- Create: `src/components/EmptyState.vue`（空状态引导：渐变圆+笔记图标+新建按钮）
- Create: `src/styles/main.css`（设计稿 tokens 移植：`:root` 浅色 + `[data-theme="dark"]` 深色，全部 var() 引用）
- Modify: `src/main.js`
- Test: 无独立单测（UI 走查）；`pnpm vitest run` 保持全绿

**Interfaces:**
- Consumes: Task 1 的 utils/search/notes；Task 2 全部 commands（经 `@tauri-apps/api/core.invoke`）
- Produces: 完整三栏静态骨架 + 主题切换生效 + 数据加载（list_notes）渲染笔记列表

- [ ] **Step 1:** 移植设计稿 tokens/组件样式到 `src/styles/main.css`（浅色+深色两套）
- [ ] **Step 2:** `store.js` 实现（含 invoke 封装 `src/lib/api.js`：`api.listNotes()` 等薄封装）
- [ ] **Step 3:** TitleBar + Sidebar + NoteList + EmptyState + App 组装；数据加载与选中/过滤联动
- [ ] **Step 4:** 验证：`pnpm tauri dev` 窗口显示三栏、8 篇示例笔记（先在数据目录播种示例笔记）可列可选、主题切换动画生效
- [ ] **Step 5:** 提交 `feat: three-pane shell + store + theme`

---

### Task 4: 编辑器（多标签 + CodeMirror + Markdown 预览）

**Files:**
- Create: `src/components/EditorArea.vue`（TabBar + EditorToolbar + 模式分段控件 + content 区 + StatusBar 组合）
- Create: `src/components/TabBar.vue`（标签：标题/脏点●/关闭×/新建+；切换）
- Create: `src/components/EditorToolbar.vue`（加粗/斜体/H1/H2/列表/引用/行内代码/链接/图片——操作 CodeMirror selection 插入 markdown 语法）
- Create: `src/components/EditorPane.vue`（CodeMirror 6 封装：markdown lang + 代码块缩进 + 快捷键 Ctrl+S/N/W）
- Create: `src/components/PreviewPane.vue`（markdown-it + highlight.js 渲染；分栏模式与 EditorPane 并排）
- Create: `src/components/StatusBar.vue`（字数/行数、光标行列、保存状态圆点）
- Modify: `package.json`（@codemirror/*、markdown-it、highlight.js 依赖）
- Test: `src/lib/__tests__/markdown.test.js`（renderMd 纯函数——从设计稿移植渲染器并增强）——预览渲染抽 `src/lib/markdown.js` 供单测

**Interfaces:**
- Consumes: store（tabs/active/dirty）、Task 1 utils、Task 2 write_note/read_note
- Produces: 完整编辑体验：多标签、自动保存（900ms 防抖→write_note）、编辑/预览/分栏三模式、格式工具条、状态栏

- [ ] **Step 1:** 写 `markdown.test.js`（标题/列表/表格/引用/代码块 fence/任务列表）FAIL → 实现 `src/lib/markdown.js`（markdown-it 配置 highlight.js，代码块语言徽章+复制按钮后处理）→ 绿
- [ ] **Step 2:** EditorPane（CodeMirror 6：`markdown()` + `languageData` 代码块高亮、`indentWithTab`、自动缩进）
- [ ] **Step 3:** PreviewPane + StatusBar + TabBar + EditorToolbar（insert 语法工具）
- [ ] **Step 4:** EditorArea 组装进 App；自动保存接线（dirty → 900ms → write_note → 状态栏"已保存"）
- [ ] **Step 5:** `pnpm tauri dev` 走查：多标签、脏点、预览/分栏、代码高亮、保存状态；提交 `feat: editor with tabs + preview`

---

### Task 5: JSON 工具 + 搜索 + 首启引导

**Files:**
- Create: `src/components/JsonBar.vue`（检测到 JSON 时浮现：格式化/校验/树状查看 + 消息区）
- Create: `src/components/JsonTree.vue`（可折叠树：展开箭头、键蓝/字符串绿/数字橙/布尔紫红/null 灰）
- Create: `src/components/SettingsPop.vue`（主题分段控件、数据目录显示+更改、关于）
- Create: `src/components/Onboarding.vue`（首启：欢迎语 + "选择笔记文件夹" 按钮 → dialog.open → set_data_dir）
- Modify: `src/store.js`（onboarding 状态、search 调后端 `search()` 或本地过滤、settings 持久化 localStorage）
- Modify: `src/lib/api.js`（新增 trash 相关 + search 调用）
- Test: `json-tools.test.js` 已覆盖；补 `store.test.js`?（store 依赖 tauri invoke——用依赖注入 mock；只测 filter/tabs 纯逻辑部分，抽取 `src/lib/store-core.js` 纯函数）

**Interfaces:**
- Consumes: Task 1 json-tools、Task 2 trash/search 命令
- Produces: JSON 工具条完整工作流；搜索（标题/正文/标签过滤+高亮+空结果态）；首启目录选择；回收站列表/恢复/彻底删除

- [ ] **Step 1:** JsonBar + JsonTree 接入编辑器；验证：打开含 JSON 的示例笔记 → 工具条出现 → 格式化/校验/树状可用
- [ ] **Step 2:** 搜索接线（标题+正文；正文片段高亮；无结果空状态"未找到与 XX 相关的内容"）
- [ ] **Step 3:** 回收站 UI（列表 + 恢复/彻底删除）接线 delete/restore/purge
- [ ] **Step 4:** Onboarding 首启流程 + SettingsPop（主题/数据目录/关于）
- [ ] **Step 5:** 提交 `feat: json tools + search + onboarding + trash`

---

### Task 6: 打磨（快捷键/外部修改/细节）

**Files:**
- Modify: `src/App.vue`（全局快捷键 Ctrl+N/S/W、切换标签 Ctrl+Tab）
- Modify: `src/store.js`（保存前 mtime 比对——write 时带 `expectedMtime`，Rust 端不一致则返回 `{conflict:true}`，前端弹"文件已被外部修改：重新加载/覆盖"）
- Modify: `src-tauri/src/commands.rs`（write_note 支持 expectedMtime 冲突检测）
- Modify: `src/components/*`（空状态插图、toast 动画、列表滚动条样式、过渡动画 150-250ms ease）
- Test: 走查清单（见 Task 7）

- [ ] **Step 1:** Rust `write_note` 冲突检测 + 测试
- [ ] **Step 2:** 快捷键 + 冲突弹窗 UI
- [ ] **Step 3:** 视觉细节打磨（悬停/聚焦三态、动画、滚动条）
- [ ] **Step 4:** 提交 `feat: shortcuts + external-change guard + polish`

---

### Task 7: 测试收尾与冒烟

**Files:**
- Create: `docs/manual-smoke.md`（手动冒烟清单：安装/首启/建/编/存/搜/删/恢复/主题/JSON/外部修改/重启持久化）
- Run: `pnpm vitest run`、`cargo test`、`cargo clippy`、`pnpm tauri build --debug`（快速构建验证）
- Test: 全部自动化测试 + 按清单手动走查（`pnpm tauri dev`）

- [ ] **Step 1:** 全量 vitest + cargo test 通过
- [ ] **Step 2:** `pnpm tauri dev` 手动走查清单每一项并记录
- [ ] **Step 3:** 修复发现的问题（各自带回归测试）
- [ ] **Step 4:** 提交 `test: full suite + smoke checklist`

---

### Task 8: 打包发布

**Files:**
- Modify: `src-tauri/tauri.conf.json`（`bundle.targets: ["nsis"]`、productName "记事本"、icon 生成）
- Create: `src-tauri/icons/*`（从设计稿品牌图标生成 32/128/256/icon.ico——用 SVG→PNG 脚本或 tauri icon 命令）
- Test: 安装包安装/卸载冒烟

- [ ] **Step 1:** 生成图标（`pnpm tauri icon` 用设计稿图标 SVG）
- [ ] **Step 2:** `pnpm tauri build` 产出 NSIS 安装包（`src-tauri/target/release/bundle/nsis/*.exe`）
- [ ] **Step 3:** 安装到系统 → 启动 → 走查核心流程 → 卸载
- [ ] **Step 4:** 提交 `build: nsis installer`
