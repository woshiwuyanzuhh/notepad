<template>
  <div class="page" @click="onPreviewClick">
    <div class="preview" v-html="html"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { renderMarkdown } from '../lib/markdown.js';
import { toast, store } from '../store.js';

const props = defineProps({
  content: { type: String, default: '' },
});

const html = computed(() => renderMarkdown(props.content, store.dataDir));

function onPreviewClick(e) {
  const link = e.target.closest('a[href]');
  if (link) {
    e.preventDefault();
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      navigator.clipboard.writeText(href)
        .then(() => toast('链接已复制，请在外部浏览器打开'))
        .catch(() => toast('复制链接失败'));
    } else if (href.startsWith('#')) {
      const target = document.getElementById(href.slice(1)) || document.querySelector(`[name="${href.slice(1)}"]`);
      target?.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast('内部链接暂不处理');
    }
    return;
  }

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
