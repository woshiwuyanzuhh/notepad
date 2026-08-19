<template>
  <div class="tabbar">
    <div
      v-for="t in store.tabs"
      :key="t.path"
      class="tab"
      :class="{ on: store.active === t.path }"
      role="tab"
      @click="store.active = t.path"
      @auxclick.middle="closeTab(t.path)"
    >
      <span v-if="t.dirty" class="tab-dot"></span>
      <span class="tab-title">{{ t.title }}</span>
      <button
        class="tab-x"
        title="关闭标签页"
        aria-label="关闭标签页"
        @click.stop="closeTab(t.path)"
      >
        <Icon name="x" />
      </button>
    </div>
    <button class="tab-add" title="新建笔记（Ctrl+N）" aria-label="新建笔记" @click="$emit('new')">
      <Icon name="plus" />
    </button>
  </div>
</template>

<script setup>
import Icon from './Icon.vue';
import { store, closeTab } from '../store.js';

defineEmits(['new']);
</script>
