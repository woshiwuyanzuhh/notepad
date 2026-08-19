<template>
  <div class="onboarding">
    <div class="ob-card">
      <div class="ob-illus"><Icon name="note" /></div>
      <h1>欢迎使用记事本</h1>
      <p>一个本地优先的个人笔记应用。所有笔记都是普通的 Markdown 文件，存放在你选择的文件夹中。</p>
      <button type="button" class="btn-primary" @click="onChoose" :disabled="busy">
        <Icon name="folder" />{{ busy ? '正在初始化…' : '选择笔记文件夹' }}
      </button>
      <div class="ob-hint">也可以选择已存在的文件夹，直接开始管理里面的 .md 文件</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Icon from './Icon.vue';
import { completeOnboarding } from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

const busy = ref(false);

async function onChoose() {
  const dir = await openDialog({
    directory: true,
    title: '选择笔记文件夹',
  });
  if (typeof dir !== 'string') return;
  busy.value = true;
  try {
    await completeOnboarding(dir);
  } catch (e) {
    busy.value = false;
    alert('初始化失败：' + e);
  }
}
</script>

<style scoped>
.onboarding {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: var(--surface);
  animation: fadeUp 0.35s var(--ease-standard);
}
.ob-card {
  text-align: center;
  max-width: 420px;
  padding: 40px 36px;
  display: grid;
  justify-items: center;
  gap: 10px;
}
.ob-illus {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  background: linear-gradient(135deg, color-mix(in oklab, var(--accent) 82%, oklch(1 0 0)), oklch(0.6 0.21 295));
  box-shadow: 0 16px 40px color-mix(in oklab, var(--accent) 32%, transparent);
  color: oklch(1 0 0);
}
.ob-illus svg {
  width: 38px;
  height: 38px;
  stroke-width: 1.5;
}
.ob-card h1 {
  font: 600 24px/1.3 var(--font-display);
  letter-spacing: -0.015em;
}
.ob-card p {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.7;
}
.ob-card .btn-primary {
  margin-top: 14px;
}
.ob-hint {
  font-size: 12px;
  color: var(--meta);
  margin-top: 4px;
}
</style>
