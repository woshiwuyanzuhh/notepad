<template>
  <div class="page" @click="onPreviewClick">
    <div class="preview" v-html="html"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { renderMarkdown } from '../lib/markdown.js';
import { toast } from '../store.js';

const props = defineProps({
  content: { type: String, default: '' },
});

const html = computed(() => renderMarkdown(props.content));

function onPreviewClick(e) {
  const btn = e.target.closest('.cb-copy');
  if (!btn) return;
  const code = btn.closest('.codeblock')?.querySelector('code');
  if (!code) return;
  navigator.clipboard
    .writeText(code.textContent)
    .then(() => toast('代码已复制'))
    .catch(() => toast('复制失败'));
}
</script>
