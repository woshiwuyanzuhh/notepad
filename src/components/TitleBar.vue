<template>
  <header id="titlebar" data-tauri-drag-region>
    <button
      v-if="!store.rail"
      id="vault-switcher"
      class="tip"
      data-tip="切换笔记库"
      :aria-expanded="vaultMenuOpen"
      aria-haspopup="menu"
      @click="vaultMenuOpen = !vaultMenuOpen"
    >
      <Icon name="vault" />
      <span class="vs-name">{{ currentVaultName }}</span>
      <Icon name="chev-d" cls="chev" />
    </button>

    <div id="titlebar-center">
      <div class="search-wrap" :class="{ 'has-q': store.query }">
        <Icon name="search" cls="search-ic" />
        <input
          id="search-field"
          v-model="store.query"
          type="text"
          placeholder="搜索笔记（标题、正文、标签）"
          autocomplete="off"
          spellcheck="false"
          aria-label="搜索笔记"
          @input="onSearchInput"
        />
        <kbd class="search-kbd">Ctrl K</kbd>
        <button class="search-clear" aria-label="清除搜索" @click="clearSearch"><Icon name="x" /></button>
      </div>
    </div>

    <div id="titlebar-right">
      <button class="btn-new" id="btn-new" aria-expanded="false" aria-haspopup="menu" @click="newMenuOpen = !newMenuOpen">
        <Icon name="plus" /><span>新建</span><Icon name="chev-d" cls="chev" />
      </button>
      <button class="tb-btn tb-clean tip" data-tip="纯净模式" aria-label="纯净模式" @click="store.pureMode = !store.pureMode">
        <Icon :name="store.pureMode ? 'collapse' : 'expand'" />
      </button>
      <button class="tb-btn tip" id="theme-btn" data-tip="切换主题" aria-label="切换主题" @click="toggleTheme">
        <Icon :name="store.theme === 'light' ? 'moon' : 'sun'" />
      </button>
      <button class="tb-btn tip" data-tip="设置" aria-label="设置" @click="store.settingsOpen = true">
        <Icon name="gear" />
      </button>
      <span class="titlebar-sep"></span>
      <div class="win-group">
        <button class="win-btn" aria-label="最小化" @click="winMin"><Icon name="win-min" /></button>
        <button class="win-btn" aria-label="最大化" @click="winMax"><Icon name="win-max" /></button>
        <button class="win-btn win-close" aria-label="关闭" @click="winClose"><Icon name="win-close" /></button>
      </div>
    </div>

    <div class="menu ctx-menu vault-menu" :class="{ open: vaultMenuOpen }" @click.stop>
      <div class="menu-title">笔记库</div>
      <div v-for="d in store.dataDirs" :key="d" class="menu-item" @click="switchTo(d)">
        <Icon name="vault" cls="m-ic" />
        <span class="m-label">{{ shortName(d) }}</span>
        <Icon v-if="d === store.dataDir" name="check" cls="m-check" />
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="addVault">
        <Icon name="plus" cls="m-ic" /><span class="m-label">添加新文件夹…</span>
      </div>
    </div>

    <div class="menu ctx-menu new-menu" :class="{ open: newMenuOpen }" @click.stop>
      <div class="menu-item" @click="onNewNote('md')">
        <Icon name="file-md" cls="m-ic" /><span class="m-label">Markdown 笔记</span><span class="m-hint">.md</span>
      </div>
      <div class="menu-item" @click="onNewNote('txt')">
        <Icon name="file-txt" cls="m-ic" /><span class="m-label">文本笔记</span><span class="m-hint">.txt</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Icon from './Icon.vue';
import {
  store, toggleTheme, createNote, searchNotes, toast, shortName,
  switchDataDir, completeOnboarding,
} from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { debounce } from '../lib/utils.js';

const appWindow = getCurrentWindow();
const vaultMenuOpen = ref(false);
const newMenuOpen = ref(false);

const currentVaultName = computed(() => shortName(store.dataDir) || '未设置');

function winMin() { appWindow.minimize().catch((e) => toast('失败：' + e)); }
function winMax() { appWindow.toggleMaximize().catch((e) => toast('失败：' + e)); }
function winClose() { appWindow.close().catch((e) => toast('失败：' + e)); }

const onSearchInput = debounce(() => { searchNotes(store.query); }, 250);
function clearSearch() { store.query = ''; searchNotes(''); }

async function onNewNote(format = 'md') {
  const folder = store.view.type === 'folder' ? store.view.key : null;
  try {
    await createNote(folder, '新笔记', format);
    newMenuOpen.value = false;
  } catch (e) { toast('新建失败：' + e); }
}

async function switchTo(dir) {
  vaultMenuOpen.value = false;
  try { await switchDataDir(dir); } catch (e) { toast('切换失败：' + e); }
}

async function addVault() {
  vaultMenuOpen.value = false;
  const dir = await openDialog({ directory: true, title: '选择笔记文件夹' });
  if (typeof dir === 'string') {
    try {
      await completeOnboarding(dir);
      toast('已添加并切换到新文件夹');
    } catch (e) { toast('添加失败：' + e); }
  }
}

function onDocClick(e) {
  if (!e.target.closest('#vault-switcher, .vault-menu')) vaultMenuOpen.value = false;
  if (!e.target.closest('#btn-new, .new-menu')) newMenuOpen.value = false;
}
onMounted(() => document.addEventListener('mousedown', onDocClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));
</script>

<style scoped>
.win-group { display: flex; height: 46px; align-items: center; }
.vault-menu, .new-menu { position: absolute; top: 46px; z-index: 300; }
.vault-menu { left: 12px; }
.new-menu { right: 120px; }
.menu-divider { height: 1px; background: var(--border-soft); margin: 4px 6px; }
</style>
