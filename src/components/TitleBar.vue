<template>
  <header class="titlebar" data-tauri-drag-region>
    <div class="brand" data-tauri-drag-region>
      <span class="brand-icon"><Icon name="file" /></span>
      <span class="brand-name">记事本</span>
    </div>

    <div class="search-wrap" :class="{ 'has-q': store.q }">
      <div class="search-box">
        <Icon name="search" />
        <input
          v-model="store.q"
          type="text"
          placeholder="搜索笔记"
          autocomplete="off"
          spellcheck="false"
          aria-label="搜索笔记"
          @input="onSearchInput"
        />
        <button class="search-clear" title="清除搜索" aria-label="清除搜索" @click="clearSearch">
          <Icon name="x" />
        </button>
      </div>
    </div>

    <div class="tb-actions">
      <div class="new-wrap">
        <button
          type="button"
          class="icon-btn accent"
          title="新建笔记（Ctrl+N）"
          aria-label="新建笔记"
          @click="onNewNote('md')"
        >
          <Icon name="plus" />
        </button>
        <button
          type="button"
          class="icon-btn new-caret"
          title="选择新建格式"
          aria-label="选择新建格式"
          @click.stop="newPop = !newPop"
        >
          <Icon name="chevron" cls="new-caret-ico" />
        </button>
        <div class="popover new-pop" :class="{ open: newPop }">
          <button type="button" class="po-row" @click="onNewNote('md')">
            <span>Markdown 笔记</span><span class="po-meta">.md</span>
          </button>
          <button type="button" class="po-row" @click="onNewNote('txt')">
            <span>文本笔记</span><span class="po-meta">.txt</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="icon-btn"
        :title="store.pureMode ? '退出纯净模式（Esc）' : '纯净编辑模式（无侧栏）'"
        aria-label="纯净编辑模式"
        @click="store.pureMode = !store.pureMode"
      >
        <Icon :name="store.pureMode ? 'collapse' : 'expand'" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :title="store.theme === 'light' ? '切换到深色主题' : '切换到浅色主题'"
        aria-label="切换深浅主题"
        @click="toggleTheme"
      >
        <Icon v-if="store.theme === 'light'" name="moon" />
        <Icon v-else name="sun" />
      </button>
      <div class="settings-wrap">
        <button type="button" class="icon-btn" title="设置" aria-label="设置" @click="popOpen = !popOpen">
          <Icon name="gear" />
        </button>
        <div class="popover" :class="{ open: popOpen }">
          <div class="po-title">外观</div>
          <div class="po-row">
            <span>主题</span>
            <span class="seg-mini">
              <button
                type="button"
                class="seg-mini-btn"
                :class="{ on: store.theme === 'light' }"
                @click="applyTheme('light')"
              >
                浅色
              </button>
              <button
                type="button"
                class="seg-mini-btn"
                :class="{ on: store.theme === 'dark' }"
                @click="applyTheme('dark')"
              >
                深色
              </button>
            </span>
          </div>
          <div class="po-row">
            <span>编辑器字体</span>
            <select
              class="po-select"
              :value="store.fontFamily"
              @change="setFontFamily($event.target.value)"
            >
              <option value="">默认</option>
              <option v-for="f in store.fonts" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="po-row">
            <span>字号</span>
            <select class="po-select" :value="store.fontSize" @change="setFontSize(Number($event.target.value))">
              <option v-for="s in [12, 13, 14, 15, 16, 18, 20, 24]" :key="s" :value="s">{{ s }} px</option>
            </select>
          </div>
          <div class="po-title">工作目录</div>
          <div class="po-dirs">
            <div
              v-for="d in store.dataDirs"
              :key="d"
              class="po-dir"
              :class="{ active: d === store.dataDir }"
            >
              <span class="dir-icon" :class="{ on: d === store.dataDir }">
                <Icon v-if="d === store.dataDir" name="check" />
              </span>
              <span class="dir-name" :title="d">{{ shortDir(d) }}</span>
              <span v-if="d === store.dataDir" class="po-meta">当前</span>
              <span v-else class="po-meta">已添加</span>
              <button
                v-if="d !== store.dataDir"
                type="button"
                class="dir-act"
                title="切换到此目录"
                @click="switchDir(d)"
              >
                <Icon name="chevronR" />
              </button>
              <button
                type="button"
                class="dir-act danger"
                title="移除"
                @click="removeDir(d)"
              >
                <Icon name="x" />
              </button>
            </div>
            <button type="button" class="po-row po-add" @click="onChooseDir">
              <Icon name="plus" />添加新文件夹
            </button>
          </div>
          <div class="po-note">所有笔记仅保存在本地 Markdown / 文本文件中，不会上传到云端。</div>
          <div class="po-row"><span>关于记事本</span><span class="po-meta">v0.1.0</span></div>
        </div>
      </div>
    </div>

    <!-- Windows 窗口控制（右上角） -->
    <div class="win-controls">
      <button type="button" class="wc-btn" title="最小化" aria-label="最小化" @click="winMin">
        <Icon name="min" />
      </button>
      <button type="button" class="wc-btn" title="最大化" aria-label="最大化" @click="winMax">
        <Icon name="max" />
      </button>
      <button type="button" class="wc-btn wc-close" title="关闭" aria-label="关闭" @click="winClose">
        <Icon name="x" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import { store, toggleTheme, applyTheme, createNote, searchNotes, toast, setFontFamily, setFontSize, switchDataDir, removeDataDir } from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { debounce } from '../lib/utils.js';

const appWindow = getCurrentWindow();

function winMin() {
  appWindow.minimize().catch((e) => toast('最小化失败：' + e));
}
function winMax() {
  appWindow.toggleMaximize().catch((e) => toast('最大化失败：' + e));
}
function winClose() {
  appWindow.close().catch((e) => toast('关闭失败：' + e));
}

const popOpen = ref(false);
const newPop = ref(false);

const dirLabel = computed(() => {
  if (!store.dataDir) return '未设置';
  return shortDir(store.dataDir);
});

function shortDir(d) {
  const s = String(d).replace(/\\/g, '/');
  const parts = s.split('/');
  return parts.length > 3 ? '…/' + parts.slice(-2).join('/') : s;
}

async function switchDir(d) {
  try {
    await switchDataDir(d);
  } catch (e) {
    toast('切换失败：' + e);
  }
}

async function removeDir(d) {
  try {
    await removeDataDir(d);
  } catch (e) {
    toast('移除失败：' + e);
  }
}

const onSearchInput = debounce(() => {
  searchNotes(store.q);
}, 250);

function clearSearch() {
  store.q = '';
  searchNotes('');
}

async function onNewNote(format = 'md') {
  const folder = store.filter.kind === 'folder' ? store.filter.value : null;
  try {
    await createNote(folder, '新笔记', format);
    popOpen.value = false;
    newPop.value = false;
  } catch (e) {
    toast('新建失败：' + e);
  }
}

async function onChooseDir() {
  const dir = await openDialog({
    directory: true,
    title: '选择笔记文件夹',
  });
  if (typeof dir === 'string') {
    const { completeOnboarding } = await import('../store.js');
    try {
      await completeOnboarding(dir);
      toast('数据目录已切换');
    } catch (e) {
      toast('切换失败：' + e);
    }
  }
  popOpen.value = false;
}
</script>

<style scoped>
.dir-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.new-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1px;
}
.new-caret {
  width: 14px;
}
.new-caret-ico {
  width: 10px !important;
  height: 10px !important;
}
.new-pop {
  width: 190px;
  left: 0;
  right: auto;
}
.new-pop .po-row {
  width: 100%;
  text-align: left;
}
.po-select {
  font: inherit;
  font-size: 12.5px;
  color: var(--fg-2);
  background: var(--bg);
  border: 1px solid var(--border-soft);
  border-radius: 7px;
  padding: 3px 6px;
  max-width: 150px;
  outline: none;
}
.po-select:focus {
  border-color: var(--accent);
}
.po-dirs {
  display: grid;
  gap: 2px;
  padding: 2px;
}
.po-dir {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--fg-2);
}
.po-dir:hover {
  background: color-mix(in oklab, var(--fg) 5%, transparent);
}
.po-dir.active {
  background: color-mix(in oklab, var(--accent) 10%, transparent);
  color: var(--fg);
}
.dir-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  display: grid;
  place-items: center;
  flex: none;
}
.dir-icon.on {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-on);
}
.dir-icon svg {
  width: 9px;
  height: 9px;
}
.po-dir .dir-name {
  flex: 1;
  min-width: 0;
}
.dir-act {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  color: var(--meta);
  flex: none;
  transition: background-color var(--motion-fast), color var(--motion-fast);
}
.dir-act:hover {
  background: color-mix(in oklab, var(--fg) 10%, transparent);
  color: var(--fg);
}
.dir-act.danger:hover {
  background: #e81123;
  color: #fff;
}
.dir-act svg {
  width: 11px;
  height: 11px;
}
.po-add {
  justify-content: flex-start;
  gap: 8px;
  color: var(--accent);
  margin-top: 2px;
  border: 1px dashed var(--border);
  width: 100%;
}
.po-add svg {
  width: 13px;
  height: 13px;
}
</style>
