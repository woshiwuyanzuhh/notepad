<template>
  <section id="listpane">
    <div id="list-header">
      <div class="lh-row1">
        <h2 id="list-title">{{ viewTitle() }}</h2>
        <span id="list-count">{{ listCount }}</span>
      </div>
      <div class="lh-tools" id="lh-tools">
        <button class="sort-btn" id="sort-btn" aria-haspopup="menu" @click="sortMenuOpen = !sortMenuOpen">
          <Icon name="clock" /><span>{{ sortLabel }}</span><Icon name="chev-d" cls="sort-chev" />
        </button>
        <span class="flex-spacer"></span>
        <div class="seg" role="tablist" aria-label="视图切换">
          <button class="seg-btn" :class="{ sel: store.listView === 'list' }" @click="setListView('list')">
            <Icon name="list" />列表
          </button>
          <button class="seg-btn" :class="{ sel: store.listView === 'grid' }" @click="setListView('grid')">
            <Icon name="grid" />网格
          </button>
        </div>
      </div>
    </div>

    <div v-if="sortMenuOpen" class="menu ctx-menu sort-menu" @click.stop>
      <div
        v-for="s in SORTS"
        :key="s.value"
        class="menu-item"
        @click="pickSort(s.value)"
      >
        <Icon :name="s.icon" cls="m-ic" /><span class="m-label">{{ s.label }}</span>
        <Icon v-if="store.sortBy === s.value" name="check" cls="m-check" />
      </div>
    </div>

    <!-- 回收站视图 -->
    <div v-if="store.view.type === 'trash'" id="note-list" class="trash-list">
      <div
        v-for="t in store.trash"
        :key="t.name"
        class="trash-row"
        @contextmenu.prevent="openCtxMenu($event, null)"
      >
        <Icon name="file" cls="trash-ic" />
        <span class="trash-name">{{ t.name.replace(/\.(md|txt)$/i, '') }}</span>
        <span class="trash-orig">{{ t.original || '未知位置' }}</span>
        <span class="trash-acts">
          <button class="mini-btn" title="恢复" @click="restoreNote(t.name)"><Icon name="restore" /></button>
          <button class="mini-btn" title="彻底删除" @click="purgeNote(t.name)"><Icon name="trash-x" /></button>
        </span>
      </div>
      <div v-if="store.trash.length === 0" class="trash-empty">回收站是空的</div>
    </div>

    <!-- 笔记列表 / 网格 -->
    <div v-else id="note-list" :class="{ grid: store.listView === 'grid' }">
      <div
        v-for="n in visible"
        :key="n.path"
        class="card"
        :class="{ sel: store.active === n.path }"
        :style="cardStyle(n)"
        :data-note="n.path"
        @click="onCardClick($event, n)"
        @contextmenu.prevent="openCtxMenu($event, n.path)"
      >
        <div class="card-head">
          <span class="badge" :class="isTxt(n) ? 'txt' : 'md'">{{ isTxt(n) ? 'TXT' : 'MD' }}</span>
          <span class="card-title">{{ n.title }}</span>
          <span class="flex-spacer"></span>
          <button
            class="mini-btn"
            :class="{ on: n.star }"
            title="收藏"
            @click.stop="toggleStar(n.path)"
          ><Icon :name="n.star ? 'star-f' : 'star'" /></button>
          <button
            class="mini-btn"
            :class="{ on: n.pin }"
            title="置顶"
            @click.stop="togglePin(n.path)"
          ><Icon name="pin" /></button>
        </div>
        <div v-if="n.tags.length" class="card-tags">
          <span v-for="t in n.tags" :key="t" class="card-tag">
            <span class="tag-dot" :class="tagDotCls(t)"></span>{{ t }}
          </span>
        </div>
        <div class="card-ex">{{ n.excerpt }}</div>
        <div class="card-foot">
          <span>{{ relTime(n.mtime) }} · {{ n.word_count }} 字</span>
          <span class="flex-spacer"></span>
          <span class="hover-acts">
            <button class="mini-btn" title="删除" @click.stop="moveToTrash(n.path)"><Icon name="trash" /></button>
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="visible.length === 0 && store.view.type !== 'trash'" id="list-empty">
      <div class="le-ic" id="le-icon"><Icon :name="store.query ? 'search' : 'all'" /></div>
      <div class="le-title" id="le-title">{{ store.query ? '未找到相关笔记' : viewTitle() }}</div>
      <div class="le-sub" id="le-sub">{{ store.query ? '换个关键词试试' : '新建一篇笔记开始记录' }}</div>
      <button class="btn-ghost" id="le-action" @click="createNote(null, '新笔记', 'md')">
        <Icon name="plus" />新建笔记
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import {
  store, visibleNotes, viewTitle, openNote, openCtxMenu, setListView, setSortBy,
  toggleStar, togglePin, moveToTrash, restoreNote, purgeNote, createNote,
} from '../store.js';
import { relTime } from '../lib/utils.js';

const SORTS = [
  { value: 'modified', label: '按修改时间', icon: 'clock' },
  { value: 'title', label: '按标题', icon: 'all' },
  { value: 'words', label: '按字数', icon: 'list' },
];
const sortMenuOpen = ref(false);

const visible = computed(() => visibleNotes());
const listCount = computed(() => (store.view.type === 'trash' ? store.trash.length : `${visible.value.length} 篇`));
const sortLabel = computed(() => SORTS.find((s) => s.value === store.sortBy)?.label || '按修改时间');

function isTxt(n) { return n.path.toLowerCase().endsWith('.txt'); }
function tagDotCls(name) {
  const colors = ['blue', 'indigo', 'cyan', 'red', 'orange', 'green', 'purple', 'pink', 'yellow'];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return colors[h % colors.length];
}
function cardStyle(n) {
  if (!n.color) return null;
  return { background: `color-mix(in srgb, ${n.color} 30%, var(--surface-warm))` };
}
function onCardClick(e, n) {
  const card = e.currentTarget;
  if (n.jelly !== false) {
    card.classList.remove('jelly');
    void card.offsetWidth;
    card.classList.add('jelly');
  }
  openNote(n.path);
}
function pickSort(v) { setSortBy(v); sortMenuOpen.value = false; }
</script>
