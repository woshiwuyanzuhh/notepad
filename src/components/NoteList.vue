<template>
  <section id="noteList">
    <div class="list-head">
      <h2 id="listTitle">{{ listTitle }}</h2>
      <span class="cnt">{{ listCount }}</span>
    </div>

    <div class="cards" @contextmenu.prevent="onListCtx">
      <!-- 回收站视图 -->
      <template v-if="store.filter.kind === 'trash'">
        <div v-for="t in store.trash" :key="t.name" class="trash-row">
          <span class="t-title">{{ t.name.replace(/\.md$/, '') }}</span>
          <span class="t-time">{{ t.original || '未知位置' }}</span>
          <span class="trash-actions">
            <button class="mini-btn" title="恢复" @click="onRestore(t.name)">
              <Icon name="restore" />
            </button>
            <button class="mini-btn" title="彻底删除" @click="onPurge(t.name)">
              <Icon name="trash" />
            </button>
          </span>
        </div>
        <div v-if="store.trash.length === 0" class="list-empty">
          <span class="le-illus"><Icon name="trash" /></span>
          <span class="le-title">回收站是空的</span>
        </div>
      </template>

      <!-- 普通笔记 -->
      <template v-else>
        <div
          v-for="n in visible"
          :key="n.path"
          class="card"
          :class="{ on: store.active === n.path }"
          :style="cardStyle(n)"
          :data-jelly="n.jelly !== false ? '1' : '0'"
          @click="onCardClick($event, n)"
          @contextmenu.prevent="onCtx($event, n.path)"
        >
          <div class="card-title" v-html="markHit(n.title, store.q)"></div>
          <div class="card-sum" v-html="markHit(n.excerpt, store.q)"></div>
          <div class="card-meta">
            <span class="type-badge" :class="isTxt(n) ? 'txt' : 'md'">{{ isTxt(n) ? 'TXT' : 'MD' }}</span>
            <span>{{ relTime(n.mtime) }}</span>
            <span class="card-flags">
              <span v-if="n.pin" class="mini-btn on-pin"><Icon name="pin" /></span>
              <span v-if="n.star" class="mini-btn on-star"><Icon name="star" /></span>
            </span>
            <span class="card-actions">
              <button
                class="mini-btn"
                :class="{ 'on-star': n.star }"
                :title="n.star ? '取消星标' : '星标'"
                @click.stop="toggleStar(n.path)"
              >
                <Icon name="star" />
              </button>
              <button
                class="mini-btn"
                :class="{ 'on-pin': n.pin }"
                :title="n.pin ? '取消置顶' : '置顶'"
                @click.stop="togglePin(n.path)"
              >
                <Icon name="pin" />
              </button>
              <button class="mini-btn" title="删除" @click.stop="onDelete(n.path)">
                <Icon name="trash" />
              </button>
            </span>
          </div>
        </div>

        <div v-if="visible.length === 0 && store.notes.length > 0" class="list-empty">
          <span class="le-illus"><Icon name="search" /></span>
          <span class="le-title">未找到与「{{ store.q || listTitle }}」相关的内容</span>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import { store, openNote, toggleStar, togglePin, moveToTrash, restoreNote, purgeNote, openCtxMenu } from '../store.js';
import { visibleNotes } from '../store.js';
import { relTime } from '../lib/utils.js';
import { markHit } from '../lib/search.js';

const visible = computed(() => visibleNotes());

const listTitle = computed(() => {
  if (store.q) return '搜索结果';
  switch (store.filter.kind) {
    case 'folder':
      return store.filter.value.split('/').pop();
    case 'tag':
      return `#${store.filter.value}`;
    case 'trash':
      return '回收站';
    default:
      return '全部笔记';
  }
});

const listCount = computed(() => {
  if (store.filter.kind === 'trash') return store.trash.length;
  return `${visible.value.length} 篇`;
});

function isTxt(n) {
  return n.path.toLowerCase().endsWith('.txt');
}

/** 卡片颜色样式（柔和背景） */
function cardStyle(n) {
  if (!n.color) return null;
  return { background: `color-mix(in srgb, ${n.color} 30%, var(--surface))` };
}

/** 卡片点击：果冻动画 + 打开笔记 */
function onCardClick(e, n) {
  const card = e.currentTarget;
  if (n.jelly !== false) {
    card.classList.remove('jelly');
    void card.offsetWidth;
    card.classList.add('jelly');
  }
  openNote(n.path);
}

/** 卡片右键菜单 */
function onCtx(e, path) {
  openCtxMenu(e, path);
}

/** 列表空白区右键（卡片已处理则跳过） */
function onListCtx(e) {
  if (e.target.closest('.card') || e.target.closest('.trash-row')) return;
  openCtxMenu(e, null);
}

async function onDelete(path) {
  await moveToTrash(path);
}

async function onRestore(name) {
  await restoreNote(name);
}

async function onPurge(name) {
  await purgeNote(name);
}
</script>
