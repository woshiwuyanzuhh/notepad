<template>
  <Teleport to="body">
    <div v-if="store.ready && !store.onboarded" class="overlay">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="选择笔记库">
        <div class="sheet-head">
          <div class="app-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5l1.2-5.8L16.9 2a2 2 0 0 1 2.8 0l1.3 1.3a2 2 0 0 1 0 2.8L10.3 16.8 5 18.5z" fill="#fff"/><path d="M14.5 4.5l4 4" stroke="#fff" stroke-width="2"/></svg></div>
          <h2>欢迎使用记事本</h2>
        </div>
        <div class="sheet-body">
          <p class="wl-sub">选择一个笔记库开始。笔记以 .md / .txt 纯文本保存在本地文件夹，随时可切换。</p>
          <div v-if="store.dataDirs.length" class="vault-list">
            <div v-for="d in store.dataDirs" :key="d" class="vault-row" @click="pick(d)">
              <Icon name="vault" />
              <span class="m-label">{{ shortName(d) }}</span>
              <Icon name="chev-r" cls="vault-chev" />
            </div>
          </div>
          <div class="wl-actions">
            <button class="btn-ghost" @click="openFolder"><Icon name="folder" />打开笔记文件夹…</button>
          </div>
          <div class="wl-note"><Icon name="lock" />数据仅保存在你的设备上，无账号、无云端依赖。</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import Icon from './Icon.vue';
import { store, completeOnboarding, shortName, switchDataDir } from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

async function openFolder() {
  const dir = await openDialog({ directory: true, title: '选择笔记文件夹' });
  if (typeof dir === 'string') {
    try { await completeOnboarding(dir); } catch (e) { alert('初始化失败：' + e); }
  }
}
async function pick(dir) {
  try { await switchDataDir(dir); } catch (e) { alert('切换失败：' + e); }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 700;
  background: var(--surface);
  display: grid; place-items: center;
}
.sheet {
  width: 440px; max-width: 90vw;
  background: var(--bg); border-radius: 18px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
  animation: fadeUp 0.3s var(--ease-standard);
}
.sheet-head {
  display: grid; justify-items: center; gap: 10px;
  padding: 34px 30px 14px; text-align: center;
}
.app-icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), #5e5ce6);
  display: grid; place-items: center;
}
.sheet-head h2 { font: 600 20px/1.3 var(--font-display); }
.sheet-body { padding: 10px 30px 28px; display: grid; gap: 12px; }
.wl-sub { font-size: 13px; color: var(--muted); line-height: 1.7; text-align: center; }
.vault-list { display: grid; gap: 4px; }
.vault-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--border-soft);
  color: var(--fg-2); cursor: pointer;
  transition: border-color var(--motion-fast), background-color var(--motion-fast);
}
.vault-row:hover { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 6%, transparent); }
.vault-row .m-label { flex: 1; }
.vault-chev { width: 14px; height: 14px; color: var(--meta); }
.wl-actions { display: flex; justify-content: center; gap: 10px; }
.wl-note {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; color: var(--meta);
  border-top: 1px solid var(--border-soft); padding-top: 12px;
}
</style>
