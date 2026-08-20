<template>
  <footer class="statusbar">
    <span id="statCount">{{ statCount }}</span>
    <span class="sb-right">
      <button
        v-if="isTxt"
        type="button"
        class="wrap-toggle"
        :class="{ on: store.wrapTxt }"
        title="切换自动换行"
        @click="setWrapTxt(!store.wrapTxt)"
      >
        <span class="wrap-box"></span>
        自动换行
      </button>
      <span class="sb-words" title="当前笔记字符数">{{ words }}</span>
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
import { store, activeTab, setWrapTxt } from '../store.js';
import { countWords, countLines } from '../lib/utils.js';

const tab = computed(() => activeTab());
const isTxt = computed(() => {
  const t = tab.value;
  return t ? t.path.toLowerCase().endsWith('.txt') : false;
});

const statCount = computed(() => {
  if (!tab.value) return '—';
  return `${countWords(tab.value.content)} 字 · ${countLines(tab.value.content)} 行`;
});

/** 右下角：当前笔记字符数 */
const words = computed(() => {
  if (!tab.value) return '';
  return `${countWords(tab.value.content)} 字`;
});

const statCursor = computed(() => '');

const saveText = computed(() => {
  if (!tab.value) return '已保存';
  return store.saveState === 'saving' ? '保存中…' : '已保存';
});
</script>

<style scoped>
.wrap-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--meta);
  padding: 3px 8px;
  border-radius: 6px;
  margin-right: 10px;
  transition: background-color var(--motion-fast), color var(--motion-fast);
}
.wrap-toggle:hover {
  background: color-mix(in oklab, var(--fg) 7%, transparent);
  color: var(--fg);
}
.wrap-box {
  width: 24px;
  height: 13px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--fg) 18%, transparent);
  position: relative;
  transition: background-color var(--motion-fast);
  flex: none;
}
.wrap-box::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-fast);
}
.wrap-toggle.on {
  color: var(--fg);
}
.wrap-toggle.on .wrap-box {
  background: var(--accent);
}
.wrap-toggle.on .wrap-box::after {
  transform: translateX(11px);
}
</style>
