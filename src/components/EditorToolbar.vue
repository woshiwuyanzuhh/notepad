<template>
  <div class="editor-toolbar">
    <div class="fmt-group">
      <button type="button" class="fmt-btn" title="加粗" @click="apply('bold')">
        <Icon name="bold" />
      </button>
      <button type="button" class="fmt-btn" title="斜体" @click="apply('italic')">
        <Icon name="italic" />
      </button>
      <button type="button" class="fmt-btn" title="标题 1" @click="apply('h1')">
        <span class="fmt-h">H<sup>1</sup></span>
      </button>
      <button type="button" class="fmt-btn" title="标题 2" @click="apply('h2')">
        <span class="fmt-h">H<sup>2</sup></span>
      </button>
      <span class="fmt-divider"></span>
      <button type="button" class="fmt-btn" title="列表" @click="apply('list')">
        <Icon name="list" />
      </button>
      <button type="button" class="fmt-btn" title="引用" @click="apply('quote')">
        <Icon name="quote" />
      </button>
      <button type="button" class="fmt-btn" title="行内代码" @click="apply('code')">
        <Icon name="code" />
      </button>
      <span class="fmt-divider"></span>
      <button type="button" class="fmt-btn" title="链接" @click="apply('link')">
        <Icon name="link" />
      </button>
      <button type="button" class="fmt-btn" title="图片" @click="apply('image')">
        <Icon name="image" />
      </button>
    </div>

    <div class="seg-wrap">
      <div class="seg">
        <span class="seg-indi" :style="{ transform: `translateX(${segIndex * 64}px)` }"></span>
        <button
          v-for="m in modes"
          :key="m.value"
          type="button"
          class="seg-btn"
          :class="{ on: store.mode === m.value }"
          @click="store.mode = m.value"
        >
          {{ m.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import { store } from '../store.js';

const emit = defineEmits(['format']);

const modes = [
  { value: 'edit', label: '编辑' },
  { value: 'preview', label: '预览' },
  { value: 'split', label: '分栏' },
];

const segIndex = computed(() => modes.findIndex((m) => m.value === store.mode));

function apply(kind) {
  emit('format', kind);
}
</script>
