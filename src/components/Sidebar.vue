<template>
  <aside id="sidebar" :class="{ rail: store.rail }">
    <!-- 库切换器 -->
    <div id="vault-block">
      <button
        id="vault-switcher-side"
        class="vs-side"
        aria-expanded="false"
        aria-haspopup="menu"
        @click="vaultMenuOpen = !vaultMenuOpen"
      >
        <Icon name="vault" />
        <span class="vs-name">{{ shortName(store.dataDir) }}</span>
        <Icon name="chev-d" cls="chev" />
      </button>
      <div v-if="vaultMenuOpen" class="menu ctx-menu side-vault-menu" @click.stop>
        <div v-for="d in store.dataDirs" :key="d" class="menu-item" @click="switchTo(d)">
          <Icon name="vault" cls="m-ic" />
          <span class="m-label">{{ shortName(d) }}</span>
          <Icon v-if="d === store.dataDir" name="check" cls="m-check" />
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="addVault">
          <Icon name="plus" cls="m-ic" /><span class="m-label">添加新文件夹…</span>
        </div>
      </div>
    </div>

    <div class="nav-scroll">
      <!-- 智能视图 -->
      <div class="nav-group-label">视图</div>
      <div id="nav-smart">
        <button
          class="nav-row tip"
          :class="{ sel: store.view.type === 'all' }"
          data-tip="全部笔记"
          @click="setView('all')"
        >
          <Icon name="all" /><span class="n-label">全部笔记</span><span class="n-count">{{ store.notes.length }}</span>
        </button>
        <button
          class="nav-row tip"
          :class="{ sel: store.view.type === 'starred' }"
          data-tip="收藏"
          @click="setView('starred')"
        >
          <Icon name="star" /><span class="n-label">收藏</span><span class="n-count">{{ starredCount }}</span>
        </button>
        <button
          class="nav-row tip"
          :class="{ sel: store.view.type === 'recent' }"
          data-tip="最近编辑"
          @click="setView('recent')"
        >
          <Icon name="clock" /><span class="n-label">最近编辑</span>
        </button>
      </div>

      <!-- 文件夹树 -->
      <div class="nav-group-label">文件夹</div>
      <div id="folder-tree">
        <template v-for="dir in topDirs" :key="dir.path">
          <div
            class="folder-row"
            :class="{ open: store.foldersOpen.has(dir.path) }"
            @click="toggleFolder(dir.path)"
          >
            <Icon name="chev-r" cls="f-caret" />
            <Icon name="folder" cls="ic" />
            <span class="n-label">{{ dir.name }}</span>
            <span class="f-badges"><span class="f-count">{{ dir.count }}</span></span>
          </div>
          <template v-if="store.foldersOpen.has(dir.path)">
            <div
              v-for="file in filesOf(dir.path)"
              :key="file.path"
              class="nav-row leaf-row"
              :class="{ sel: store.active === file.path }"
              :data-note="file.path"
              @click="onLeafClick($event, file)"
              @contextmenu.prevent="openCtxMenu($event, file.path)"
            >
              <Icon :name="isTxt(file) ? 'file-txt' : 'file-md'" cls="ic" />
              <span class="n-label">{{ file.title }}</span>
              <span class="f-badges">
                <span class="f-badge" :class="isTxt(file) ? 'txt' : 'md'">{{ isTxt(file) ? 'TXT' : 'MD' }}</span>
              </span>
            </div>
          </template>
        </template>
      </div>

      <!-- 标签 -->
      <div class="nav-group-label tags-label">
        <span>标签</span>
        <button class="tag-add-btn tip" data-tip="添加标签" aria-label="添加标签" @click="openTagAdd">
          <Icon name="plus" />
        </button>
      </div>
      <div id="tag-list">
        <div v-if="store.tagAddOpen" class="nav-row tag-add-row">
          <input
            ref="tagAddInput"
            class="tag-input"
            type="text"
            placeholder="新标签名"
            @keydown.enter="confirmTagAdd"
            @keydown.esc="store.tagAddOpen = false"
          />
          <button class="mini-btn" @click="confirmTagAdd"><Icon name="check" /></button>
          <button class="mini-btn" @click="store.tagAddOpen = false"><Icon name="x" /></button>
        </div>
        <div v-if="store.tagEditName !== null" class="nav-row tag-edit-row">
          <input
            ref="tagEditInput"
            class="tag-input"
            type="text"
            :value="store.tagEditName"
            @keydown.enter="confirmTagEdit"
            @keydown.esc="store.tagEditName = null"
          />
          <button class="mini-btn" @click="confirmTagEdit"><Icon name="check" /></button>
          <button class="mini-btn" @click="store.tagEditName = null"><Icon name="x" /></button>
        </div>
        <template v-for="t in tags" :key="t.name">
          <div
            class="nav-row tag-row"
            :class="{ sel: store.view.type === 'tag' && store.view.key === t.name }"
            @click="setView('tag', t.name)"
          >
            <span class="tag-dot" :class="tagDotCls(t.name)"></span>
            <span class="n-label">{{ t.name }}</span>
            <span class="n-count">{{ t.count }}</span>
            <span class="tag-acts">
              <button class="mini-btn" title="编辑标签" @click.stop="startTagEdit(t)"><Icon name="pen" /></button>
              <button class="mini-btn" title="删除标签" @click.stop="confirmTagDel(t)"><Icon name="trash-x" /></button>
            </span>
          </div>
        </template>
      </div>
    </div>

    <div class="sidebar-foot">
      <button
        class="nav-row tip"
        :class="{ sel: store.view.type === 'trash' }"
        data-tip="回收站"
        @click="setView('trash')"
      >
        <Icon name="trash" /><span class="n-label">回收站</span><span class="n-count">{{ store.trash.length }}</span>
      </button>
      <button class="rail-toggle tip" data-tip="折叠侧栏" aria-label="折叠侧栏" @click="store.rail = !store.rail">
        <Icon name="collapse" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import Icon from './Icon.vue';
import {
  store, setView, openNote, openCtxMenu, shortName, switchDataDir,
  tagList, addTag, renameTag, deleteTag, completeOnboarding, toast,
} from '../store.js';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

const vaultMenuOpen = ref(false);
const tagAddInput = ref(null);
const tagEditInput = ref(null);

const tags = computed(() => tagList());
const starredCount = computed(() => store.notes.filter((n) => n.star).length);

function isTxt(n) { return n.path.toLowerCase().endsWith('.txt'); }
function tagDotCls(name) {
  const colors = ['blue', 'indigo', 'cyan', 'red', 'orange', 'green', 'purple', 'pink', 'yellow'];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return colors[h % colors.length];
}

const topDirs = computed(() => {
  const seen = new Set();
  const out = [];
  for (const n of store.notes) {
    if (!n.folder) continue;
    const top = n.folder.split('/')[0];
    if (!seen.has(top)) { seen.add(top); out.push({ name: top, path: top, count: 0 }); }
  }
  for (const d of out) {
    d.count = store.notes.filter((n) => n.folder === d.path || n.folder.startsWith(d.path + '/')).length;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
});
function toggleFolder(path) {
  const next = new Set(store.foldersOpen);
  if (next.has(path)) next.delete(path); else next.add(path);
  store.foldersOpen = next;
}
function filesOf(path) {
  return store.notes.filter((n) => n.folder === path).sort((a, b) => b.mtime - a.mtime);
}
function onLeafClick(e, file) {
  const row = e.currentTarget;
  if (file.jelly !== false) {
    row.classList.remove('jelly');
    void row.offsetWidth;
    row.classList.add('jelly');
  }
  openNote(file.path);
}

async function openTagAdd() {
  store.tagAddOpen = true;
  await nextTick();
  if (tagAddInput.value) tagAddInput.value.focus();
}
async function confirmTagAdd() {
  const input = tagAddInput.value;
  if (!input) return;
  await addTag(input.value);
  store.tagAddOpen = false;
}
async function startTagEdit(t) {
  store.tagEditName = t.name;
  await nextTick();
  if (tagEditInput.value) { tagEditInput.value.focus(); tagEditInput.value.select(); }
}
async function confirmTagEdit() {
  const input = tagEditInput.value;
  if (!input) return;
  await renameTag(store.tagEditName, input.value);
  store.tagEditName = null;
}
async function confirmTagDel(t) {
  const { ask } = await import('@tauri-apps/plugin-dialog');
  const ok = await ask(`删除标签「${t.name}」？将从所有笔记中移除。`, {
    title: '删除标签', kind: 'warning', okLabel: '删除', cancelLabel: '取消',
  });
  if (ok) await deleteTag(t.name);
}

async function switchTo(dir) {
  vaultMenuOpen.value = false;
  try { await switchDataDir(dir); } catch (e) { toast('切换失败：' + e); }
}
async function addVault() {
  vaultMenuOpen.value = false;
  const dir = await openDialog({ directory: true, title: '选择笔记文件夹' });
  if (typeof dir === 'string') {
    try { await completeOnboarding(dir); toast('已添加并切换'); } catch (e) { toast('添加失败：' + e); }
  }
}
</script>
