<template>
  <Teleport to="body">
    <div v-if="store.settingsOpen" class="overlay" @click.self="store.settingsOpen = false">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="设置">
        <div class="sheet-head">
          <h2>设置</h2>
          <button class="tb-btn" aria-label="关闭设置" @click="store.settingsOpen = false"><Icon name="x" /></button>
        </div>
        <div class="set-body">
          <nav class="set-nav">
            <button class="set-nav-btn" :class="{ sel: tab === 'appearance' }" @click="tab = 'appearance'">
              <Icon name="sun" />外观
            </button>
            <button class="set-nav-btn" :class="{ sel: tab === 'editor' }" @click="tab = 'editor'">
              <Icon name="pen" />编辑器
            </button>
            <button class="set-nav-btn" :class="{ sel: tab === 'vaults' }" @click="tab = 'vaults'">
              <Icon name="vault" />库管理
            </button>
            <button class="set-nav-btn" :class="{ sel: tab === 'about' }" @click="tab = 'about'">
              <Icon name="gear" />关于
            </button>
          </nav>

          <div class="set-pane">
            <template v-if="tab === 'appearance'">
              <div class="set-row">
                <span class="set-label">主题</span>
                <div class="seg">
                  <button class="seg-btn" :class="{ sel: store.theme === 'light' }" @click="applyTheme('light')">浅色</button>
                  <button class="seg-btn" :class="{ sel: store.theme === 'dark' }" @click="applyTheme('dark')">深色</button>
                </div>
              </div>
              <div class="set-note">浅色 / 深色主题，即时生效并记忆。</div>
            </template>

            <template v-else-if="tab === 'editor'">
              <div class="set-row">
                <span class="set-label">编辑器字体</span>
                <select class="set-select" :value="store.fontFamily" @change="setFontFamily($event.target.value)">
                  <option value="">默认</option>
                  <option v-for="f in store.fonts" :key="f" :value="f">{{ f }}</option>
                </select>
              </div>
              <div class="set-row">
                <span class="set-label">字号</span>
                <select class="set-select" :value="store.fontSize" @change="setFontSize(Number($event.target.value))">
                  <option v-for="s in [12, 13, 14, 15, 16, 18, 20, 24]" :key="s" :value="s">{{ s }} px</option>
                </select>
              </div>
              <div class="set-row">
                <span class="set-label">txt 自动换行</span>
                <button class="switch" :class="{ on: store.wrapTxt }" @click="setWrapTxt(!store.wrapTxt)">
                  <span class="knob"></span>
                </button>
              </div>
            </template>

            <template v-else-if="tab === 'vaults'">
              <div v-for="d in store.dataDirs" :key="d" class="set-row">
                <span class="set-label vault-dir" :title="d">{{ shortName(d) }}</span>
                <span v-if="d === store.dataDir" class="set-hint">当前</span>
                <button v-if="d !== store.dataDir" class="btn-ghost" @click="switchTo(d)">切换</button>
                <button class="btn-ghost danger" @click="removeDir(d)">移除</button>
              </div>
              <button class="btn-ghost" @click="addVault"><Icon name="plus" />添加新文件夹…</button>
            </template>

            <template v-else>
              <div class="about-block">
                <div class="app-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5l1.2-5.8L16.9 2a2 2 0 0 1 2.8 0l1.3 1.3a2 2 0 0 1 0 2.8L10.3 16.8 5 18.5z" fill="#fff"/><path d="M14.5 4.5l4 4" stroke="#fff" stroke-width="2"/></svg></div>
                <div class="about-name">记事本</div>
                <div class="about-ver">v0.1.0 · 本地优先的个人笔记应用</div>
                <div class="about-note">所有笔记保存在本地文件夹中，数据完全由你掌控。</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import Icon from './Icon.vue';
import {
  store, applyTheme, setFontFamily, setFontSize, setWrapTxt, shortName,
  switchDataDir, removeDataDir, completeOnboarding, toast,
} from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

const tab = ref('appearance');

async function switchTo(dir) {
  try { await switchDataDir(dir); } catch (e) { toast('切换失败：' + e); }
}
async function removeDir(dir) {
  try { await removeDataDir(dir); } catch (e) { toast('移除失败：' + e); }
}
async function addVault() {
  const dir = await openDialog({ directory: true, title: '选择笔记文件夹' });
  if (typeof dir === 'string') {
    try { await completeOnboarding(dir); toast('已添加并切换'); } catch (e) { toast('添加失败：' + e); }
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0, 0, 0, 0.35);
  display: grid; place-items: center;
}
.sheet {
  width: 560px; max-height: 72vh; overflow-y: auto;
  background: var(--bg); border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
  animation: popIn 0.18s var(--ease-standard);
}
.sheet-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-soft);
}
.sheet-head h2 { font: 600 17px/1.2 var(--font-display); }
.set-body { display: flex; min-height: 320px; }
.set-nav {
  width: 150px; padding: 12px 10px; display: grid; gap: 2px;
  border-right: 1px solid var(--border-soft); align-content: start;
}
.set-nav-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 8px; font-size: 13px;
  color: var(--fg-2); text-align: left;
  transition: background-color var(--motion-fast), color var(--motion-fast);
}
.set-nav-btn:hover { background: color-mix(in oklab, var(--fg) 6%, transparent); color: var(--fg); }
.set-nav-btn.sel { background: color-mix(in oklab, var(--accent) 12%, transparent); color: var(--accent); }
.set-nav-btn svg { width: 15px; height: 15px; }
.set-pane { flex: 1; padding: 16px 20px; display: grid; gap: 12px; align-content: start; }
.set-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; font-size: 13.5px; color: var(--fg);
}
.set-label { color: var(--fg-2); }
.set-hint { font-size: 12px; color: var(--meta); }
.set-select {
  font: inherit; font-size: 12.5px; color: var(--fg-2);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 7px; padding: 4px 8px; outline: none;
}
.set-note { font-size: 12px; color: var(--meta); line-height: 1.6; }
.vault-dir { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-ghost.danger:hover { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 40%, transparent); }
.switch {
  width: 36px; height: 20px; border-radius: 999px;
  background: color-mix(in oklab, var(--fg) 18%, transparent);
  position: relative; transition: background-color var(--motion-fast);
}
.switch .knob {
  position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  border-radius: 50%; background: var(--bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-fast);
}
.switch.on { background: var(--accent); }
.switch.on .knob { transform: translateX(16px); }
.about-block { text-align: center; padding: 24px 0; display: grid; justify-items: center; gap: 8px; }
.app-icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), #5e5ce6);
  display: grid; place-items: center;
}
.about-name { font: 600 18px/1.3 var(--font-display); }
.about-ver { font-size: 12.5px; color: var(--meta); }
.about-note { font-size: 12.5px; color: var(--muted); }
</style>
