<template>
  <header class="titlebar">
    <div class="traffic" aria-hidden="true">
      <span class="tl red" title="关闭"></span>
      <span class="tl yellow" title="最小化"></span>
      <span class="tl green" title="最大化"></span>
    </div>

    <div class="brand">
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
      <button
        type="button"
        class="icon-btn accent"
        title="新建笔记（Ctrl+N）"
        aria-label="新建笔记"
        @click="onNewNote"
      >
        <Icon name="plus" />
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
          <div class="po-row" @click="onChooseDir">
            <span>笔记文件夹</span>
            <span class="po-meta dir-name" :title="store.dataDir">{{ dirLabel }}</span>
          </div>
          <div class="po-note">所有笔记仅保存在本地 Markdown 文件中，不会上传到云端。</div>
          <div class="po-row"><span>关于记事本</span><span class="po-meta">v0.1.0</span></div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import { store, toggleTheme, applyTheme, createNote, searchNotes, toast } from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { debounce } from '../lib/utils.js';

const popOpen = ref(false);

const dirLabel = computed(() => {
  if (!store.dataDir) return '未设置';
  const d = store.dataDir.replace(/\\/g, '/');
  const parts = d.split('/');
  return parts.length > 3 ? '…/' + parts.slice(-2).join('/') : d;
});

const onSearchInput = debounce(() => {
  searchNotes(store.q);
}, 250);

function clearSearch() {
  store.q = '';
  searchNotes('');
}

async function onNewNote() {
  const folder = store.filter.kind === 'folder' ? store.filter.value : null;
  try {
    await createNote(folder, '新笔记');
    popOpen.value = false;
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
</style>
