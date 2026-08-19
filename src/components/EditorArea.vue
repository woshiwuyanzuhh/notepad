<template>
  <section id="editor">
    <template v-if="tab">
      <TabBar @new="onNewNote" />

      <EditorToolbar @format="onFormat" />

      <JsonBar ref="jsonBar" @format-json="onFormatJson" />

      <div class="content" :class="store.mode">
        <div v-if="store.mode !== 'preview'" class="edit-pane">
          <EditorPane
            ref="editorPane"
            :content="tab.content"
            :is-markdown="!tab.path.toLowerCase().endsWith('.txt')"
            @update:content="onContent"
          />
        </div>
        <div v-if="store.mode !== 'edit'" class="preview-pane">
          <PreviewPane :content="tab.content" />
        </div>
      </div>
    </template>

    <EmptyState v-else @create="onNewNote" />

    <JsonTree v-if="store.jsonOpen && jsonValue !== undefined" :json="jsonValue" />

    <StatusBar />
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import TabBar from './TabBar.vue';
import EditorToolbar from './EditorToolbar.vue';
import EditorPane from './EditorPane.vue';
import PreviewPane from './PreviewPane.vue';
import JsonBar from './JsonBar.vue';
import JsonTree from './JsonTree.vue';
import StatusBar from './StatusBar.vue';
import EmptyState from './EmptyState.vue';
import { store, activeTab, markDirty, createNote, toast } from '../store.js';
import { detectJson } from '../lib/json-tools.js';
import { api } from '../lib/api.js';

const editorPane = ref(null);
const jsonBar = ref(null);

const tab = computed(() => activeTab());
const jsonValue = computed(() => {
  if (!tab.value) return undefined;
  const info = detectJson(tab.value.content);
  return info ? info.json : undefined;
});

function onContent(content) {
  if (!tab.value) return;
  tab.value.content = content;
  markDirty(tab.value.path);
  if (jsonBar.value) jsonBar.value.refresh();
}

function onFormatJson(text) {
  if (!tab.value) return;
  tab.value.content = text;
  markDirty(tab.value.path);
}

function onFormat(kind) {
  if (kind === 'image') {
    insertImage();
    return;
  }
  // 预览模式下点击格式按钮 → 自动切回编辑再插入
  if (store.mode === 'preview') {
    store.mode = 'edit';
    nextTick(() => {
      if (editorPane.value) editorPane.value.format(kind);
    });
  } else if (editorPane.value) {
    editorPane.value.format(kind);
  }
}

async function insertImage() {
  const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
  const file = await openDialog({
    multiple: false,
    title: '插入图片',
    filters: [
      { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] },
    ],
  });
  if (typeof file !== 'string') return;
  try {
    const rel = await api.importImage(file);
    if (editorPane.value) {
      const name = rel.split('/').pop().replace(/\.[^.]+$/, '');
      editorPane.value.insertText(`\n![${name}](${rel})\n`);
    }
  } catch (e) {
    toast('图片导入失败：' + e);
  }
}

async function onNewNote() {
  const folder = store.filter.kind === 'folder' ? store.filter.value : null;
  await createNote(folder, '新笔记');
}

// 内容切换后刷新 JSON 工具条与 CodeMirror
watch(
  () => store.active,
  async () => {
    await nextTick();
    if (jsonBar.value) jsonBar.value.refresh();
  },
);
</script>
