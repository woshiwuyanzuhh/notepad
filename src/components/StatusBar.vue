<template>
  <footer class="statusbar">
    <span id="statCount">{{ statCount }}</span>
    <span class="sb-right">
      <span id="statCursor">{{ statCursor }}</span>
      <span class="save-state" :class="store.saveState">
        <span class="save-dot"></span>
        <span id="saveText">{{ saveText }}</span>
      </span>
    </span>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { store, activeTab } from '../store.js';
import { countWords, countLines } from '../lib/utils.js';

const statCount = computed(() => {
  const tab = activeTab();
  if (!tab) return '—';
  return `${countWords(tab.content)} 字 · ${countLines(tab.content)} 行`;
});

const statCursor = computed(() => {
  const tab = activeTab();
  if (!tab) return '';
  return '';
});

const saveText = computed(() => {
  if (!activeTab()) return '已保存';
  return store.saveState === 'saving' ? '保存中…' : '已保存';
});
</script>
