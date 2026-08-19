// store.js — 全局响应式状态 + 动作（调用后端命令）

import { reactive } from 'vue';
import { api } from './lib/api.js';
import { normalizeNotes, normalizeNote } from './lib/notes.js';
import { debounce } from './lib/utils.js';

export const store = reactive({
  ready: false,
  onboarded: false,
  dataDir: null,

  notes: [],
  trash: [],
  searchHits: [],

  tabs: [], // { path, title, content, dirty, loaded }
  active: null,

  filter: { kind: 'all', value: null }, // all | folder | tag | trash | search
  q: '',

  theme: 'light',
  rail: false,
  mode: 'split', // edit | preview | split
  jsonOpen: false,

  saveState: 'saved', // saved | saving
  toastMsg: '',
  toastTimer: null,
});

/* ── 主题 ─────────────────────────────────────────────── */
export function applyTheme(theme) {
  store.theme = theme;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('notepad-theme', theme);
  } catch { /* ignore */ }
}

export function initTheme() {
  let saved = 'light';
  try {
    saved = localStorage.getItem('notepad-theme') || 'light';
  } catch { /* ignore */ }
  applyTheme(saved);
}

export function toggleTheme() {
  applyTheme(store.theme === 'light' ? 'dark' : 'light');
}

/* ── 提示 ─────────────────────────────────────────────── */
export function toast(msg) {
  store.toastMsg = msg;
  clearTimeout(store.toastTimer);
  store.toastTimer = setTimeout(() => {
    store.toastMsg = '';
  }, 1800);
}

/* ── 初始化 / 引导 ─────────────────────────────────────── */
export async function init() {
  initTheme();
  try {
    const cfg = await api.getConfig();
    if (cfg && cfg.data_dir) {
      store.dataDir = cfg.data_dir;
      store.onboarded = true;
      await refreshNotes();
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
  store.onboarded = true;
  await refreshNotes();
  if (store.notes.length === 0) {
    await createNote('', '欢迎使用记事本');
  }
}

/* ── 笔记列表 ─────────────────────────────────────────── */
export async function refreshNotes() {
  const list = await api.listNotes();
  store.notes = normalizeNotes(list);
  await refreshTrash();
}

export async function refreshTrash() {
  store.trash = await api.listTrash();
}

/* ── 标签页 ───────────────────────────────────────────── */
export async function openNote(path) {
  const existing = store.tabs.find((t) => t.path === path);
  if (existing) {
    store.active = path;
    return;
  }
  const { content, mtime } = await api.readNote(path);
  const meta = store.notes.find((n) => n.path === path);
  store.tabs.push({
    path,
    title: meta ? meta.title : path.split('/').pop().replace(/\.md$/, ''),
    content,
    mtime,
    dirty: false,
    loaded: true,
  });
  store.active = path;
  store.filter = { kind: 'all', value: null };
  store.q = '';
}

export async function createNote(folder, title) {
  const path = await api.createNote(folder, title);
  await refreshNotes();
  await openNote(path);
  return path;
}

export function closeTab(path) {
  const idx = store.tabs.findIndex((t) => t.path === path);
  if (idx === -1) return;
  store.tabs.splice(idx, 1);
  if (store.active === path) {
    const next = store.tabs[idx] || store.tabs[idx - 1];
    store.active = next ? next.path : null;
  }
}

const saveDebounced = debounce((path) => {
  doSave(path);
}, 900);

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
        title: '文件冲突',
        kind: 'warning',
        okLabel: '覆盖',
        cancelLabel: '重新加载',
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
  meta.excerpt = first || '暂无内容';
}

/* ── 元数据操作 ───────────────────────────────────────── */
export async function toggleStar(path) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  const next = !meta.star;
  await api.setNoteMeta(path, { star: next });
  meta.star = next;
}

export async function togglePin(path) {
  const meta = store.notes.find((n) => n.path === path);
  if (!meta) return;
  const next = !meta.pin;
  await api.setNoteMeta(path, { pin: next });
  meta.pin = next;
  await refreshNotes();
}

export async function moveToTrash(path) {
  const tab = store.tabs.find((t) => t.path === path);
  if (tab && tab.dirty) {
    await doSave(path);
  }
  await api.deleteNote(path);
  closeTab(path);
  await refreshNotes();
}

export async function restoreNote(name) {
  await api.restoreNote(name);
  await refreshNotes();
}

export async function purgeNote(name) {
  await api.purgeNote(name);
  await refreshNotes();
}

/* ── 搜索 ─────────────────────────────────────────────── */
export async function searchNotes(q) {
  store.q = q;
  if (q.trim()) {
    store.searchHits = await api.search(q);
  } else {
    store.searchHits = [];
  }
}

/* ── 派生数据 ─────────────────────────────────────────── */
export function folderTree() {
  const tree = {};
  for (const n of store.notes) {
    if (!n.folder) continue;
    const parts = n.folder.split('/');
    let node = tree;
    let path = '';
    for (const p of parts) {
      path = path ? `${path}/${p}` : p;
      node[path] = node[path] || { count: 0, children: {} };
      node = node[path].children;
    }
  }
  const counts = {};
  for (const n of store.notes) {
    if (!n.folder) continue;
    counts[n.folder] = (counts[n.folder] || 0) + 1;
  }
  return { tree, counts };
}

export function tagList() {
  const map = new Map();
  for (const n of store.notes) {
    for (const t of n.tags) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}

export function visibleNotes() {
  if (store.q.trim()) {
    const q = store.q.trim().toLowerCase();
    return store.notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.join(' ').toLowerCase().includes(q),
    );
  }
  const f = store.filter;
  if (f.kind === 'folder') {
    return store.notes.filter((n) => n.folder === f.value || n.folder.startsWith(f.value + '/'));
  }
  if (f.kind === 'tag') {
    return store.notes.filter((n) => n.tags.includes(f.value));
  }
  return store.notes;
}

export function activeTab() {
  return store.tabs.find((t) => t.path === store.active) || null;
}
