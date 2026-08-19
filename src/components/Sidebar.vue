<template>
  <aside id="sidebar" :class="{ rail: store.rail }">
    <nav class="side-nav">
      <!-- 全部笔记 -->
      <button
        type="button"
        class="side-item"
        :class="{ on: isOn('all') }"
        @click="setFilter('all')"
      >
        <Icon name="note" />
        <span class="si-label">全部笔记</span>
        <span class="cnt">{{ store.notes.length }}</span>
      </button>

      <!-- 文件夹 -->
      <div v-if="!store.rail" class="side-sec-head">文件夹</div>
      <template v-for="(node, path) in folders" :key="path">
        <div
          class="folder-row"
          :class="{ open: openSet.has(path) }"
          @click="toggleFolder(path)"
        >
          <span class="caret"><Icon name="chevron" /></span>
          <Icon name="folder" />
          <span class="si-label">{{ leafName(path) }}</span>
          <span class="cnt">{{ node.count }}</span>
        </div>
        <div v-if="openSet.has(path)" class="folder-children open">
          <button
            type="button"
            class="side-item folder-child"
            :class="{ on: isOn('folder', path) }"
            @click="setFilter('folder', path)"
          >
            <span class="si-label">{{ path }}</span>
            <span class="cnt">{{ node.count }}</span>
          </button>
        </div>
      </template>

      <!-- 标签 -->
      <div v-if="!store.rail" class="side-sec-head">标签</div>
      <button
        v-for="t in tags"
        :key="t.name"
        type="button"
        class="tag-pill"
        :class="{ on: isOn('tag', t.name) }"
        @click="setFilter('tag', t.name)"
      >
        <span class="tag-dot" :style="{ background: tagColor(t.name) }"></span>
        <span class="si-label">{{ t.name }}</span>
        <span class="cnt">{{ t.count }}</span>
      </button>

      <!-- 回收站 -->
      <button
        type="button"
        class="side-item"
        :class="{ on: isOn('trash') }"
        @click="setFilter('trash')"
      >
        <Icon name="trash" />
        <span class="si-label">回收站</span>
        <span class="cnt">{{ store.trash.length }}</span>
      </button>
    </nav>

    <div class="side-foot">
      <button type="button" class="side-toggle" @click="store.rail = !store.rail">
        <Icon name="sidebar" />
        <span class="tl-label">折叠侧栏</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { store, folderTree, tagList } from '../store.js';

const openSet = ref(new Set(['工作']));

const folders = computed(() => {
  const { counts } = folderTree();
  return counts;
});

const tags = computed(() => tagList());

function leafName(path) {
  return path.split('/').pop();
}

function toggleFolder(path) {
  const next = new Set(openSet.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  openSet.value = next;
}

function setFilter(kind, value = null) {
  store.filter = { kind, value };
  store.q = '';
}

function isOn(kind, value = null) {
  return store.filter.kind === kind && store.filter.value === value;
}

const TAG_COLORS = ['oklch(.60 .18 256)', 'oklch(.75 .16 75)', 'oklch(.55 .18 315)', 'oklch(.65 .12 190)', 'oklch(.70 .18 20)'];
function tagColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}
</script>
