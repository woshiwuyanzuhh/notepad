<template>
  <div class="idle">
    <div class="idle-inner">
      <div class="idle-illus"><Icon name="note" /></div>
      <h2>新建你的第一篇笔记</h2>
      <p>笔记以 Markdown 文件保存在本地文件夹中，随时随地打开其他编辑器也能查看。</p>
      <button type="button" class="btn-primary" @click="$emit('create')">
        <Icon name="plus" />新建笔记
      </button>
      <div class="hint">快捷键 <span class="kbd">Ctrl</span> + <span class="kbd">N</span></div>
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue';

defineEmits(['create']);
</script>
