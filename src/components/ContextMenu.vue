<template>
  <Teleport to="body">
    <div
      v-if="store.ctxMenu.visible"
      class="ctx-overlay"
      @click="closeCtxMenu"
      @contextmenu.prevent="closeCtxMenu"
    >
      <div class="ctx-menu" :style="{ left: store.ctxMenu.x + 'px', top: store.ctxMenu.y + 'px' }">
        <template v-if="note">
          <div class="ctx-title">{{ note.title }}</div>

          <div class="ctx-sec">卡片颜色</div>
          <div class="ctx-colors">
            <button
              v-for="c in COLORS"
              :key="c.value"
              type="button"
              class="ctx-color"
              :class="{ on: (note.color || '') === c.value }"
              :style="{ background: c.value }"
              :title="c.label"
              @click="pickColor(c.value)"
            ></button>
            <button
              type="button"
              class="ctx-color clear"
              :class="{ on: !note.color }"
              title="默认"
              @click="pickColor('')"
            >
              <Icon name="x" />
            </button>
          </div>

          <div class="ctx-row" @click="toggleJelly">
            <span>果冻动画</span>
            <span class="ctx-switch" :class="{ on: jellyOn }"><span class="knob"></span></span>
          </div>

          <div class="ctx-divider"></div>

          <div class="ctx-row" @click="onStar">
            <Icon name="star" :cls="note.star ? 'ico-on-star' : ''" />
            <span>{{ note.star ? '取消星标' : '星标' }}</span>
          </div>
          <div class="ctx-row" @click="onPin">
            <Icon name="pin" :cls="note.pin ? 'ico-on-pin' : ''" />
            <span>{{ note.pin ? '取消置顶' : '置顶' }}</span>
          </div>
          <div class="ctx-row danger" @click="onDelete">
            <Icon name="trash" />
            <span>删除</span>
          </div>
        </template>

        <template v-else>
          <div class="ctx-row" @click="onNewMd">
            <Icon name="plus" />
            <span>新建 Markdown 笔记</span>
          </div>
          <div class="ctx-row" @click="onNewTxt">
            <Icon name="file" />
            <span>新建文本笔记</span>
          </div>
          <div class="ctx-divider"></div>
          <div class="ctx-row" @click="onRefresh">
            <Icon name="restore" />
            <span>刷新</span>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import {
  store,
  closeCtxMenu,
  setNoteColor,
  setNoteJelly,
  toggleStar,
  togglePin,
  moveToTrash,
  createNote,
  refreshNotes,
  toast,
} from '../store.js';

const COLORS = [
  { value: '#FFD9D9', label: '浅红' },
  { value: '#FFE8C7', label: '浅橙' },
  { value: '#FFF3B8', label: '浅黄' },
  { value: '#D9F2D9', label: '浅绿' },
  { value: '#D6ECFF', label: '浅蓝' },
  { value: '#E5DBFF', label: '浅紫' },
  { value: '#FFDCF0', label: '浅粉' },
];

const note = computed(() => {
  const p = store.ctxMenu.path;
  return p ? store.notes.find((n) => n.path === p) || null : null;
});

const jellyOn = computed(() => {
  if (!note.value) return true;
  return note.value.jelly !== false;
});

async function pickColor(c) {
  if (note.value) await setNoteColor(note.value.path, c);
  closeCtxMenu();
}

async function toggleJelly() {
  if (note.value) await setNoteJelly(note.value.path, !jellyOn.value);
  closeCtxMenu();
}

async function onStar() {
  if (note.value) await toggleStar(note.value.path);
  closeCtxMenu();
}

async function onPin() {
  if (note.value) await togglePin(note.value.path);
  closeCtxMenu();
}

async function onDelete() {
  if (note.value) await moveToTrash(note.value.path);
  closeCtxMenu();
}

async function onNewMd() {
  const folder = store.filter.kind === 'folder' ? store.filter.value : null;
  await createNote(folder, '新笔记', 'md');
  closeCtxMenu();
}

async function onNewTxt() {
  const folder = store.filter.kind === 'folder' ? store.filter.value : null;
  await createNote(folder, '新笔记', 'txt');
  closeCtxMenu();
}

async function onRefresh() {
  try {
    await refreshNotes();
    toast('已刷新');
  } catch (e) {
    toast('刷新失败：' + e);
  }
  closeCtxMenu();
}
</script>

<style scoped>
.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
}
.ctx-menu {
  position: fixed;
  width: 220px;
  background: var(--bg);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 6px;
  animation: popIn 0.15s var(--ease-standard);
}
html[data-theme='dark'] .ctx-menu {
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
}
.ctx-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--meta);
  padding: 6px 10px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.ctx-sec {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--meta);
  letter-spacing: 0.04em;
  padding: 6px 10px 4px;
}
.ctx-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 10px 8px;
}
.ctx-color {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: transform var(--motion-fast), border-color var(--motion-fast);
}
.ctx-color:hover {
  transform: scale(1.15);
}
.ctx-color.on {
  border-color: var(--fg);
}
.ctx-color.clear {
  background: color-mix(in oklab, var(--fg) 8%, transparent);
  color: var(--meta);
  display: grid;
  place-items: center;
}
.ctx-color.clear svg {
  width: 11px;
  height: 11px;
}
.ctx-row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--fg-2);
  text-align: left;
  transition: background-color var(--motion-fast), color var(--motion-fast);
}
.ctx-row:hover {
  background: color-mix(in oklab, var(--fg) 6%, transparent);
  color: var(--fg);
}
.ctx-row svg {
  width: 14px;
  height: 14px;
  flex: none;
}
.ctx-row.danger:hover {
  color: #e81123;
}
.ctx-row .ico-on-star {
  color: oklch(0.79 0.17 85);
}
.ctx-row .ico-on-pin {
  color: var(--accent);
}
.ctx-divider {
  height: 1px;
  background: var(--border-soft);
  margin: 4px 6px;
}
.ctx-switch {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--fg) 18%, transparent);
  position: relative;
  margin-left: auto;
  transition: background-color var(--motion-fast);
  flex: none;
}
.ctx-switch .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-fast);
}
.ctx-switch.on {
  background: var(--accent);
}
.ctx-switch.on .knob {
  transform: translateX(14px);
}
</style>
