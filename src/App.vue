<template>
  <div id="app" :class="{ rail: store.rail, pure: store.pureMode }">
    <IconSprite />

    <TitleBar />

    <main id="main">
      <Sidebar v-if="!store.pureMode" />
      <NoteList v-if="!store.pureMode" />
      <EditorArea />
    </main>

    <WelcomeOverlay />
    <SettingsModal />
    <ContextMenu />

    <div id="toast" :class="{ show: store.toastMsg }" role="status">{{ store.toastMsg }}</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import IconSprite from './components/IconSprite.vue';
import TitleBar from './components/TitleBar.vue';
import Sidebar from './components/Sidebar.vue';
import NoteList from './components/NoteList.vue';
import EditorArea from './components/EditorArea.vue';
import WelcomeOverlay from './components/WelcomeOverlay.vue';
import SettingsModal from './components/SettingsModal.vue';
import ContextMenu from './components/ContextMenu.vue';
import { store, init, createNote, doSave, closeTab, activeTab, closeCtxMenu } from './store.js';

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (store.ctxMenu.visible) { closeCtxMenu(); return; }
    if (store.settingsOpen) { store.settingsOpen = false; return; }
    if (store.pureMode) { store.pureMode = false; return; }
  }
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const key = e.key.toLowerCase();
  if (key === 'n') {
    e.preventDefault();
    const folder = store.view.type === 'folder' ? store.view.key : null;
    createNote(folder, '新笔记', 'md');
  } else if (key === 's') {
    e.preventDefault();
    const tab = activeTab();
    if (tab) doSave(tab.path);
  } else if (key === 'w') {
    e.preventDefault();
    const tab = activeTab();
    if (tab) closeTab(tab.path);
  } else if (key === 'k') {
    e.preventDefault();
    document.getElementById('search-field')?.focus();
  } else if (key === 'tab' && store.tabs.length > 1) {
    e.preventDefault();
    const idx = store.tabs.findIndex((t) => t.path === store.active);
    const next = store.tabs[(idx + 1) % store.tabs.length];
    store.active = next.path;
  }
}

function onContextMenu(e) {
  if (e.defaultPrevented) return;
  const target = e.target;
  const inInput = target.closest
    ? target.closest('input, textarea, select, .cm-content, [contenteditable]')
    : false;
  if (inInput) return;
  e.preventDefault();
}

function onMouseDown(e) {
  if (store.ctxMenu.visible && !e.target.closest('.ctx-menu')) closeCtxMenu();
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('mousedown', onMouseDown);
  init();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('contextmenu', onContextMenu);
  window.removeEventListener('mousedown', onMouseDown);
});
</script>
