<template>
  <div id="app">
    <TitleBar />

    <main id="main">
      <Sidebar v-if="!store.pureMode" />
      <NoteList v-if="!store.pureMode" />
      <EditorArea />
    </main>

    <Onboarding v-if="store.ready && !store.onboarded" />

    <div id="toast" :class="{ show: store.toastMsg }" role="status">{{ store.toastMsg }}</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import TitleBar from './components/TitleBar.vue';
import Sidebar from './components/Sidebar.vue';
import NoteList from './components/NoteList.vue';
import EditorArea from './components/EditorArea.vue';
import Onboarding from './components/Onboarding.vue';
import { store, init, createNote, doSave, closeTab, activeTab } from './store.js';

function onKeydown(e) {
  if (e.key === 'Escape' && store.pureMode) {
    store.pureMode = false;
    return;
  }
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const key = e.key.toLowerCase();
  if (key === 'n') {
    e.preventDefault();
    const folder = store.filter.kind === 'folder' ? store.filter.value : null;
    createNote(folder, '新笔记');
  } else if (key === 's') {
    e.preventDefault();
    const tab = activeTab();
    if (tab) doSave(tab.path);
  } else if (key === 'w') {
    e.preventDefault();
    const tab = activeTab();
    if (tab) closeTab(tab.path);
  } else if (key === 'tab' && store.tabs.length > 1) {
    e.preventDefault();
    const idx = store.tabs.findIndex((t) => t.path === store.active);
    const next = store.tabs[(idx + 1) % store.tabs.length];
    store.active = next.path;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  init();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>
