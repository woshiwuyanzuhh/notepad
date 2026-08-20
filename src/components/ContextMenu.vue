<template>
  <Teleport to="body">
    <div
      v-if="store.ctxMenu.visible"
      class="ctx-overlay"
      @click="closeCtxMenu"
      @contextmenu.prevent="closeCtxMenu"
    >
      <div class="menu ctx-menu" :class="{ open: store.ctxMenu.visible }" :style="{ left: store.ctxMenu.x + 'px', top: store.ctxMenu.y + 'px' }">
        <!-- 重命名面板 -->
        <template v-if="store.ctxMenu.panel === 'rename'">
          <div class="ctx-head">重新命名</div>
          <div class="ctx-rename-row">
            <input
              ref="renameInput"
              class="ctx-input"
              type="text"
              :value="renameValue"
              @keydown.enter="confirmRename"
              @keydown.esc="closeCtxMenu"
            />
          </div>
          <div class="ctx-hint">回车确认 · Esc 取消</div>
        </template>

        <!-- 标签面板 -->
        <template v-else-if="store.ctxMenu.panel === 'tags'">
          <div class="ctx-head">设置标签</div>
          <div class="tag-panel-list">
            <div
              v-for="t in tags"
              :key="t.name"
              class="tag-panel-item"
              :class="{ on: noteTags.includes(t.name) }"
              @click="toggleTag(t.name)"
            >
              <span class="tag-dot" :class="tagDotCls(t.name)"></span>
              <span class="m-label">{{ t.name }}</span>
              <Icon v-if="noteTags.includes(t.name)" name="check" cls="m-check" />
            </div>
            <div class="tag-panel-add">
              <input
                ref="tagInput"
                class="ctx-input"
                type="text"
                placeholder="新标签名，回车创建"
                @keydown.enter="createTag"
              />
            </div>
          </div>
        </template>

        <!-- 普通菜单 -->
        <template v-else>
          <template v-if="note">
            <div class="ctx-head">{{ note.title }}</div>
            <div class="menu-item" @click="openRename"><Icon name="pen" cls="m-ic" /><span class="m-label">重新命名</span></div>
            <div class="menu-item" @click="openTags"><Icon name="tag" cls="m-ic" /><span class="m-label">设置标签</span></div>
            <div class="menu-divider"></div>
            <div class="menu-title">卡片颜色</div>
            <div class="ctx-colors">
              <button
                v-for="c in COLORS"
                :key="c.value"
                type="button"
                class="ctx-dot"
                :class="{ on: (note.color || '') === c.value }"
                :style="{ background: c.value }"
                :title="c.label"
                @click="pickColor(c.value)"
              ></button>
              <button
                type="button"
                class="ctx-dot clear"
                :class="{ on: !note.color }"
                title="默认"
                @click="pickColor('')"
              ><Icon name="x" /></button>
            </div>
            <div class="ctx-row" @click="toggleJelly">
              <Icon name="jelly" cls="m-ic" /><span class="m-label">果冻动画</span>
              <span class="switch" :class="{ on: jellyOn }"><span class="knob"></span></span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" @click="onStar">
              <Icon :name="note.star ? 'star-f' : 'star'" cls="m-ic" />
              <span class="m-label">{{ note.star ? '取消收藏' : '收藏' }}</span>
            </div>
            <div class="menu-item" @click="onPin">
              <Icon name="pin" cls="m-ic" />
              <span class="m-label">{{ note.pin ? '取消置顶' : '置顶' }}</span>
            </div>
            <div class="menu-item danger" @click="onDelete">
              <Icon name="trash" cls="m-ic" /><span class="m-label">删除</span>
            </div>
          </template>

          <template v-else>
            <div class="ctx-head">{{ store.ctxMenu.folder ? `文件夹 · ${store.ctxMenu.folder}` : '' }}</div>
            <div class="menu-item" @click="onNewMd">
              <Icon name="file-md" cls="m-ic" /><span class="m-label">{{ store.ctxMenu.folder ? '在此文件夹新建 Markdown 笔记' : '新建 Markdown 笔记' }}</span>
            </div>
            <div class="menu-item" @click="onNewTxt">
              <Icon name="file-txt" cls="m-ic" /><span class="m-label">{{ store.ctxMenu.folder ? '在此文件夹新建文本笔记' : '新建文本笔记' }}</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" @click="onRefresh"><Icon name="refresh" cls="m-ic" /><span class="m-label">刷新</span></div>
          </template>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import Icon from './Icon.vue';
import {
  store, closeCtxMenu, setNoteColor, setNoteJelly, toggleStar, togglePin,
  moveToTrash, createNote, refreshNotes, toast, tagList, setNoteTags, renameNote,
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

const renameInput = ref(null);
const tagInput = ref(null);

const note = computed(() => {
  const p = store.ctxMenu.path;
  return p ? store.notes.find((n) => n.path === p) || null : null;
});
const jellyOn = computed(() => (note.value ? note.value.jelly !== false : true));
const tags = computed(() => tagList());
const noteTags = computed(() => (note.value ? note.value.tags.slice() : []));
const renameValue = computed(() => (note.value ? note.value.title : ''));

function tagDotCls(name) {
  const colors = ['blue', 'indigo', 'cyan', 'red', 'orange', 'green', 'purple', 'pink', 'yellow'];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return colors[h % colors.length];
}

function openRename() {
  store.ctxMenu.panel = 'rename';
  nextTick(() => {
    if (renameInput.value) { renameInput.value.focus(); renameInput.value.select(); }
  });
}
async function confirmRename() {
  const input = renameInput.value;
  if (!input || !note.value) return;
  const name = input.value.trim();
  if (!name) { closeCtxMenu(); return; }
  try {
    await renameNote(note.value.path, name);
    toast('已重命名');
  } catch (e) {
    toast('重命名失败：' + e);
  }
  closeCtxMenu();
}

function openTags() {
  store.ctxMenu.panel = 'tags';
  nextTick(() => { if (tagInput.value) tagInput.value.focus(); });
}
async function toggleTag(name) {
  if (!note.value) return;
  const tags = noteTags.value.includes(name)
    ? noteTags.value.filter((t) => t !== name)
    : [...noteTags.value, name];
  await setNoteTags(note.value.path, tags);
}
async function createTag() {
  const input = tagInput.value;
  if (!input || !note.value) return;
  const name = input.value.trim();
  if (!name) return;
  const tags = noteTags.value.includes(name) ? noteTags.value : [...noteTags.value, name];
  await setNoteTags(note.value.path, tags);
  input.value = '';
}

async function pickColor(c) {
  if (note.value) await setNoteColor(note.value.path, c);
  closeCtxMenu();
}
async function toggleJelly() {
  if (note.value) await setNoteJelly(note.value.path, !jellyOn.value);
  closeCtxMenu();
}

async function onStar() { if (note.value) await toggleStar(note.value.path); closeCtxMenu(); }
async function onPin() { if (note.value) await togglePin(note.value.path); closeCtxMenu(); }
async function onDelete() { if (note.value) await moveToTrash(note.value.path); closeCtxMenu(); }
async function onNewMd() {
  const folder = store.ctxMenu.folder || (store.view.type === 'folder' ? store.view.key : null);
  await createNote(folder, '新笔记', 'md');
  closeCtxMenu();
}
async function onNewTxt() {
  const folder = store.ctxMenu.folder || (store.view.type === 'folder' ? store.view.key : null);
  await createNote(folder, '新笔记', 'txt');
  closeCtxMenu();
}
async function onRefresh() {
  try { await refreshNotes(); toast('已刷新'); } catch (e) { toast('刷新失败：' + e); }
  closeCtxMenu();
}
</script>

<style scoped>
.ctx-overlay { position: fixed; inset: 0; z-index: 500; }
.ctx-menu { position: fixed; width: 230px; }
.ctx-head {
  font-size: 12.5px; color: var(--muted); padding: 8px 10px 7px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  border-bottom: 1px solid var(--border-soft); margin-bottom: 4px;
}
.ctx-colors { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 10px 8px; }
.ctx-dot {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent;
  transition: transform var(--motion-fast), border-color var(--motion-fast);
}
.ctx-dot:hover { transform: scale(1.15); }
.ctx-dot.on { border-color: var(--fg); }
.ctx-dot.clear {
  background: color-mix(in oklab, var(--fg) 8%, transparent);
  color: var(--meta); display: grid; place-items: center;
}
.ctx-dot.clear svg { width: 11px; height: 11px; }
.ctx-row {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 7px 10px; border-radius: 8px; font-size: 13px;
  color: var(--fg-2); text-align: left;
  transition: background-color var(--motion-fast), color var(--motion-fast);
}
.ctx-row:hover { background: color-mix(in oklab, var(--fg) 6%, transparent); color: var(--fg); }
.switch {
  width: 32px; height: 18px; border-radius: 999px;
  background: color-mix(in oklab, var(--fg) 18%, transparent);
  position: relative; margin-left: auto; flex: none;
  transition: background-color var(--motion-fast);
}
.switch .knob {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  border-radius: 50%; background: var(--bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--motion-fast);
}
.switch.on { background: var(--accent); }
.switch.on .knob { transform: translateX(14px); }
.ctx-rename-row { padding: 4px 10px; }
.ctx-input {
  width: 100%; font: inherit; font-size: 13px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 7px; padding: 5px 9px; color: var(--fg); outline: none;
}
.ctx-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent); }
.ctx-hint { font-size: 11px; color: var(--meta); padding: 4px 10px 6px; }
.tag-panel-list { padding: 2px 8px 10px; display: grid; gap: 2px; max-height: 240px; overflow-y: auto; }
.tag-panel-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 7px; font-size: 13px;
  color: var(--fg-2); cursor: pointer;
}
.tag-panel-item:hover { background: color-mix(in oklab, var(--fg) 6%, transparent); }
.tag-panel-item.on { color: var(--accent); }
.tag-panel-add { padding: 6px 2px 2px; }
.menu-item.danger:hover { color: var(--danger); }
</style>
