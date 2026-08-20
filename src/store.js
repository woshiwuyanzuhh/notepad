// store.js — 全局响应式状态 + 动作（调用后端命令）

import { reactive } from 'vue';
import { api } from './lib/api.js';
import { normalizeNotes } from './lib/notes.js';
import { debounce } from './lib/utils.js';

export const store = reactive({
  ready: false,
  onboarded: false,
  dataDir: null,
  dataDirs: [],

  notes: [],
  trash: [],
  searchHits: [],

  tabs: [], // { path, title, content, dirty, loaded, mtime }
  active: null,

  // 视图：all | starred | recent | folder | tag | trash
  view: { type: 'all', key: null },
  query: '',
  sortBy: 'modified', // modified | title | words
  listView: 'list', // list | grid

  theme: 'light',
  rail: false,
  pureMode: false,
  mode: 'split', // edit | preview | split
  jsonOpen: false,

  fonts: [],
  fontFamily: '',
  fontSize: 15,
  wrapTxt: false,

  saveState: 'saved',
  toastMsg: '',
  toastTimer: null,

  // 侧栏标签编辑状态
  tagAddOpen: false,
  tagEditName: null,
  tagDelName: null,
  foldersOpen: new Set(['工作']),

  // 右键菜单
  ctxMenu: { visible: false, x: 0, y: 0, path: null, folder: null, panel: null }, // panel: null | 'rename' | 'tags'

  // UI 浮层
  settingsOpen: false,
  welcomeOpen: false,
  newMenuOpen: false,
  sortMenuOpen: false,
});

/* ── 主题 ─────────────────────────────────────────────── */
export function applyTheme(theme) {
  store.theme = theme;
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('notepad-theme', theme); } catch { /* ignore */ }
}
export function initTheme() {
  let saved = 'light';
  try { saved = localStorage.getItem('notepad-theme') || 'light'; } catch { /* ignore */ }
  applyTheme(saved);
}
export function toggleTheme() { applyTheme(store.theme === 'light' ? 'dark' : 'light'); }

/* ── 视图 / 排序 ──────────────────────────────────────── */
export function setView(type, key = null) {
  store.view = { type, key };
  store.query = '';
}
export function setListView(v) {
  store.listView = v;
  try { localStorage.setItem('notepad-listview', v); } catch { /* ignore */ }
}
export function setSortBy(s) {
  store.sortBy = s;
  try { localStorage.setItem('notepad-sort', s); } catch { /* ignore */ }
}

/* ── 编辑器字体 / 换行 ─────────────────────────── */
export function applyFont() {
  const root = document.documentElement;
  root.style.setProperty('--editor-font', store.fontFamily || 'var(--font-body)');
  root.style.setProperty('--editor-font-size', `${store.fontSize}px`);
  try {
    localStorage.setItem('notepad-font', store.fontFamily);
    localStorage.setItem('notepad-fontsize', String(store.fontSize));
  } catch { /* ignore */ }
}
export function setFontFamily(family) { store.fontFamily = family; applyFont(); }
export function setFontSize(size) { store.fontSize = size; applyFont(); }
export function setWrapTxt(on) {
  store.wrapTxt = on;
  try { localStorage.setItem('notepad-wraptxt', on ? '1' : '0'); } catch { /* ignore */ }
}
export async function loadFonts() {
  try { store.fonts = await api.listFonts(); } catch { store.fonts = []; }
}
function initPrefs() {
  try {
    store.fontFamily = localStorage.getItem('notepad-font') || '';
    const size = Number(localStorage.getItem('notepad-fontsize'));
    if (size >= 10 && size <= 32) store.fontSize = size;
    store.wrapTxt = localStorage.getItem('notepad-wraptxt') === '1';
    store.listView = localStorage.getItem('notepad-listview') || 'list';
    store.sortBy = localStorage.getItem('notepad-sort') || 'modified';
    if (!['modified', 'created', 'title'].includes(store.sortBy)) store.sortBy = 'modified';
  } catch { /* ignore */ }
  applyFont();
}

/* ── 提示 ─────────────────────────────────────────────── */
export function toast(msg) {
  store.toastMsg = msg;
  clearTimeout(store.toastTimer);
  store.toastTimer = setTimeout(() => { store.toastMsg = ''; }, 1800);
}

/* ── 初始化 / 引导 ─────────────────────────────────────── */
/** 持久化当前 tab 会话（打开的标签 + 激活项），按数据目录隔离 */
function persistSession() {
  try {
    localStorage.setItem('notepad-session', JSON.stringify({
      dir: store.dataDir,
      tabs: store.tabs.map((t) => t.path),
      active: store.active,
    }));
  } catch { /* ignore */ }
}
/** 启动时恢复上次会话：仅当目录一致且文件仍存在时才恢复（防幽灵 tab） */
async function restoreSession() {
  try {
    const s = JSON.parse(localStorage.getItem('notepad-session') || 'null');
    if (!s || s.dir !== store.dataDir || !Array.isArray(s.tabs)) return;
    const alive = new Set(store.notes.map((n) => n.path));
    for (const p of s.tabs) {
      if (alive.has(p)) await openNote(p);
    }
    if (s.active && store.tabs.some((t) => t.path === s.active)) store.active = s.active;
  } catch { /* ignore */ }
}
export async function init() {
  initTheme();
  initPrefs();
  loadFonts();
  try {
    const cfg = await api.getConfig();
    if (cfg && cfg.data_dir) {
      store.dataDir = cfg.data_dir;
      store.dataDirs = Array.isArray(cfg.data_dirs) && cfg.data_dirs.length ? cfg.data_dirs : [cfg.data_dir];
      store.onboarded = true;
      await refreshNotes();
      await restoreSession();
    } else {
      store.onboarded = false;
    }
  } catch (e) {
    console.error('init failed', e);
    store.onboarded = false;
  }
  store.ready = true;
}

export async function completeOnboarding(dir) {
  await api.setDataDir(dir);
  store.dataDir = dir;
  if (!store.dataDirs.includes(dir)) store.dataDirs.push(dir);
  store.onboarded = true;
  await refreshNotes();
  if (store.notes.length === 0) {
    await createNote('', '欢迎使用记事本');
  }
}

export async function switchDataDir(dir) {
  if (dir === store.dataDir) return;
  await api.setDataDir(dir);
  store.dataDir = dir;
  if (!store.dataDirs.includes(dir)) store.dataDirs.push(dir);
  closeAllTabs();
  store.query = '';
  store.view = { type: 'all', key: null };
  await refreshNotes();
  toast('已切换到：' + shortName(dir));
}

export async function removeDataDir(dir) {
  if (store.dataDirs.length <= 1) { toast('至少保留一个工作目录'); return; }
  const wasActive = dir === store.dataDir;
  await api.removeDataDir(dir);
  store.dataDirs = store.dataDirs.filter((d) => d !== dir);
  if (wasActive) {
    const cfg = await api.getConfig();
    store.dataDir = cfg.data_dir || null;
    closeAllTabs();
    await refreshNotes();
    toast('已移除并切换');
  } else {
    toast('已移除工作目录');
  }
}

function closeAllTabs() {
  store.tabs = [];
  store.active = null;
  store.jsonOpen = false;
  persistSession();
}

/* ── 笔记列表 ─────────────────────────────────────────── */
export async function refreshNotes() {
  const list = await api.listNotes();
  store.notes = normalizeNotes(list);
  // 清理悬空标签页：文件已不存在且无未保存内容时自动关闭（dirty 的保留，避免丢失未保存编辑）
  const alive = new Set(store.notes.map((n) => n.path));
  for (const t of [...store.tabs]) {
    if (!alive.has(t.path) && !t.dirty) closeTab(t.path);
  }
  await refreshTrash();
}
export async function refreshTrash() {
  store.trash = await api.listTrash();
}

/* ── 标签页 ───────────────────────────────────────────── */
export async function openNote(path) {
  const existing = store.tabs.find((t) => t.path === path);
  if (existing) { store.active = path; return; }
  const { content, mtime } = await api.readNote(path);
  const meta = store.notes.find((n) => n.path === path);
  store.tabs.push({
    path,
    title: meta ? meta.title : path.split('/').pop().replace(/\.(md|txt)$/i, ''),
    content,
    mtime,
    dirty: false,
    loaded: true,
  });
  store.active = path;
  store.view = { type: 'all', key: null };
  store.query = '';
  persistSession();
}

export async function createNote(folder, title, format = 'md') {
  const path = await api.createNote(folder, title, format);
  await refreshNotes();
  await openNote(path);
  return path;
}

export async function renameNote(path, newName) {
  const newPath = await api.renameNote(path, newName);
  // 更新标签页
  const tab = store.tabs.find((t) => t.path === path);
  if (tab) {
    tab.path = newPath;
    tab.title = newName.replace(/\.(md|txt)$/i, '');
  }
  if (store.active === path) store.active = newPath;
  await refreshNotes();
  persistSession();
  return newPath;
}

export function closeTab(path) {
  const idx = store.tabs.findIndex((t) => t.path === path);
  if (idx === -1) return;
  store.tabs.splice(idx, 1);
  if (store.active === path) {
    const next = store.tabs[idx] || store.tabs[idx - 1];
    store.active = next ? next.path : null;
  }
  persistSession();
}

const saveDebounced = debounce((path) => { doSave(path); }, 900);

export function markDirty(path) {
  const tab = store.tabs.find((t) => t.path === path);
  if (!tab) return;
  tab.dirty = true;
  store.saveState = 'saving';
  saveDebounced(path);
}

export async function doSave(path) {
  const tab = store.tabs.find((t) => t.path === path);
  if (!tab) return;
  try {
    const savedMtime = await api.writeNote(path, tab.content, tab.mtime);
    tab.mtime = savedMtime;
    tab.dirty = false;
    store.saveState = 'saved';
    updateExcerpt(tab);
  } catch (e) {
    const msg = String(e);
    if (msg.startsWith('CONFLICT:')) {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      const overwrite = await ask('文件已被外部修改，是否用当前内容覆盖？', {
        title: '文件冲突', kind: 'warning', okLabel: '覆盖', cancelLabel: '重新加载',
      });
      if (overwrite) {
        const savedMtime = await api.writeNote(path, tab.content, null);
        tab.mtime = savedMtime;
        tab.dirty = false;
        store.saveState = 'saved';
        updateExcerpt(tab);
        toast('已覆盖外部修改');
      } else {
        const r = await api.readNote(path);
        tab.content = r.content;
        tab.mtime = r.mtime;
        tab.dirty = false;
        store.saveState = 'saved';
        toast('已重新加载外部版本');
      }
    } else {
      store.saveState = 'saved';
      toast('保存失败：' + e);
    }
  }
}

function updateExcerpt(tab) {
  const meta = store.notes.find((n) => n.path === tab.path);
  if (!meta) return;
  const first = tab.content
    .split(/\r?\n/)
    .map((l) => l.replace(/^#{1,6}\s+/, '').trim())
    .find((l) => l && !l.startsWith('```'));
  meta.excerpt = first || '空白笔记';
  meta.word_count = countWords(tab.content);
}

function countWords(text) {
  const han = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const latin = (text.match(/[A-Za-z0-9_]+(?:['-][A-Za-z0-9_]+)*/g) || []).length;
  return han + latin;
}

/* ── 元数据操作 ───────────────────────────────────────── */
export async function toggleStar(path) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  meta.star = !meta.star;
  await api.setNoteMeta(path, { star: meta.star });
}
export async function togglePin(path) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  meta.pin = !meta.pin;
  await api.setNoteMeta(path, { pin: meta.pin });
  await refreshNotes();
}
export async function setNoteColor(path, color) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  await api.setNoteMeta(path, { color });
  meta.color = color || null;
}
export async function setNoteJelly(path, on) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  await api.setNoteMeta(path, { jelly: on });
  meta.jelly = on;
}
export async function setNoteTags(path, tags) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  await api.setNoteMeta(path, { tags });
  meta.tags = tags.slice();
}
export async function moveToTrash(path) {
  const tab = store.tabs.find((t) => t.path === path);
  if (tab && tab.dirty) await doSave(path);
  await api.deleteNote(path);
  closeTab(path);
  await refreshNotes();
}
export async function restoreNote(name) { await api.restoreNote(name); await refreshNotes(); }
export async function purgeNote(name) { await api.purgeNote(name); await refreshNotes(); }

/* ── 标签管理 ─────────────────────────────────────────── */
export function tagList() {
  const map = new Map();
  for (const n of store.notes) {
    for (const t of n.tags) map.set(t, (map.get(t) || 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}
export async function addTag(name) {
  const t = String(name || '').trim();
  if (!t) return;
  if (tagList().some((x) => x.name === t)) { toast('标签已存在'); return; }
  const active = activeTab();
  if (!active) { toast('请先打开一篇笔记'); return; }
  const meta = store.notes.find((n) => n.path === active.path);
  const tags = meta ? [...meta.tags, t] : [t];
  await setNoteTags(active.path, tags);
  toast(`已创建标签「${t}」`);
}
export async function renameTag(oldName, newName) {
  const t = String(newName || '').trim();
  if (!t || t === oldName) return;
  await api.renameTag(oldName, t);
  await refreshNotes();
  toast(`标签「${oldName}」→「${t}」`);
}
export async function deleteTag(name) {
  await api.deleteTag(name);
  await refreshNotes();
  toast(`已删除标签「${name}」`);
}

/* ── 搜索 ─────────────────────────────────────────────── */
export async function searchNotes(q) {
  store.query = q;
  if (q.trim()) {
    store.searchHits = await api.search(q);
  } else {
    store.searchHits = [];
  }
}

/* ── 右键菜单 ─────────────────────────────────────────── */
export function openCtxMenu(e, path, folder = null) {
  store.ctxMenu.visible = true;
  store.ctxMenu.path = path;
  store.ctxMenu.folder = folder;
  store.ctxMenu.panel = null;
  const menuW = 230;
  const menuH = 380;
  store.ctxMenu.x = Math.min(e.clientX, window.innerWidth - menuW - 8);
  store.ctxMenu.y = Math.min(e.clientY, window.innerHeight - menuH - 8);
}
export function closeCtxMenu() {
  store.ctxMenu.visible = false;
  store.ctxMenu.path = null;
  store.ctxMenu.folder = null;
  store.ctxMenu.panel = null;
}

/* ── 派生数据 ─────────────────────────────────────────── */
export function shortName(dir) {
  const s = String(dir || '').replace(/\\/g, '/').replace(/\/+$/, '');
  return s.split('/').pop() || s;
}

export function folderTree() {
  // 返回：顶层文件夹数组 [{name, path, count, files:[NoteMeta]}]
  const dirs = new Map();
  const filesByDir = new Map();
  for (const n of store.notes) {
    if (!n.folder) {
      if (!filesByDir.has('')) filesByDir.set('', []);
      filesByDir.get('').push(n);
      continue;
    }
    const parts = n.folder.split('/');
    let acc = '';
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      if (!dirs.has(acc)) dirs.set(acc, { name: p, path: acc, count: 0 });
    }
    if (!filesByDir.has(n.folder)) filesByDir.set(n.folder, []);
    filesByDir.get(n.folder).push(n);
  }
  // count 为该目录直接文件数 + 子目录数（简化：直接文件数）
  for (const [dir, files] of filesByDir) {
    if (dirs.has(dir)) dirs.get(dir).count = files.length;
  }
  return { dirs: [...dirs.values()], filesByDir };
}

export function visibleNotes() {
  let list = store.notes;
  if (store.query.trim()) {
    const q = store.query.trim().toLowerCase();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.join(' ').toLowerCase().includes(q),
    );
  } else {
    const v = store.view;
    if (v.type === 'starred') list = list.filter((n) => n.star);
    else if (v.type === 'recent') list = [...list].sort((a, b) => b.mtime - a.mtime).slice(0, 30);
    else if (v.type === 'folder') list = list.filter((n) => n.folder === v.key || n.folder.startsWith(v.key + '/'));
    else if (v.type === 'tag') list = list.filter((n) => n.tags.includes(v.key));
    else if (v.type === 'trash') return [];
  }
  const s = store.sortBy;
  return [...list].sort((a, b) => {
    if (a.pin !== b.pin) return b.pin - a.pin;
    if (s === 'title') return a.title.localeCompare(b.title, 'zh');
    if (s === 'created') return b.ctime - a.ctime;
    return b.mtime - a.mtime;
  });
}

export function activeTab() {
  return store.tabs.find((t) => t.path === store.active) || null;
}

export function viewTitle() {
  if (store.query.trim()) return '搜索结果';
  switch (store.view.type) {
    case 'starred': return '收藏';
    case 'recent': return '最近编辑';
    case 'folder': return (store.view.key || '').split('/').pop();
    case 'tag': return `#${store.view.key}`;
    case 'trash': return '回收站';
    default: return '全部笔记';
  }
}
