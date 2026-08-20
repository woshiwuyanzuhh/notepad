<template>
  <section id="editorpane">
    <!-- 标签栏 -->
    <div id="tabbar">
      <div id="tab-scroll">
        <div
          v-for="t in store.tabs"
          :key="t.path"
          class="tab"
          :class="{ sel: store.active === t.path }"
          @click="store.active = t.path"
          @auxclick.middle="closeTab(t.path)"
        >
          <Icon :name="t.path.toLowerCase().endsWith('.txt') ? 'file-txt' : 'file-md'" :cls="t.path.toLowerCase().endsWith('.txt') ? 't-type txt' : 't-type md'" />
          <span class="t-name">{{ t.title }}</span>
          <span v-if="t.dirty" class="t-dot" title="未保存"></span>
          <button class="t-close" aria-label="关闭标签页" @click.stop="closeTab(t.path)"><Icon name="x" /></button>
        </div>
      </div>
      <button class="tab-new tip" data-tip="新建笔记" aria-label="新建笔记" @click="onNewNote">
        <Icon name="plus" />
      </button>
    </div>

    <!-- 工具条 -->
    <div v-if="tab" id="editor-toolbar">
      <div id="fmt-group">
        <button class="tool-btn tip" data-tip="标题 1" @click="fmt('h1')"><Icon name="h1" /></button>
        <button class="tool-btn tip" data-tip="加粗" @click="fmt('bold')"><Icon name="bold" /></button>
        <button class="tool-btn tip" data-tip="斜体" @click="fmt('italic')"><Icon name="italic" /></button>
        <span class="tool-sep"></span>
        <button class="tool-btn tip" data-tip="引用" @click="fmt('quote')"><Icon name="quote" /></button>
        <button class="tool-btn tip" data-tip="代码块" @click="fmt('codeblock')"><Icon name="code" /></button>
        <button class="tool-btn tip" data-tip="行内代码" @click="fmt('code')"><Icon name="mono" /></button>
        <span class="tool-sep"></span>
        <button class="tool-btn tip" data-tip="链接" @click="fmt('link')"><Icon name="link" /></button>
        <button class="tool-btn tip" data-tip="插入图片" @click="insertImage"><Icon name="image" /></button>
        <button class="tool-btn tip" data-tip="无序列表" @click="fmt('list')"><Icon name="list-ul" /></button>
      </div>
      <div v-if="isTxt" class="toolbar-hint" id="txt-hint">纯文本 · 无格式</div>
      <span class="flex-spacer"></span>
      <div class="seg" id="mode-toggle" role="tablist" aria-label="编辑模式">
        <button class="seg-btn" :class="{ sel: store.mode === 'edit' }" @click="store.mode = 'edit'">
          <Icon name="pen" />编辑
        </button>
        <button class="seg-btn" :class="{ sel: store.mode === 'split' }" @click="store.mode = 'split'">
          <Icon name="split" />分栏
        </button>
        <button class="seg-btn" :class="{ sel: store.mode === 'preview' }" @click="store.mode = 'preview'">
          <Icon name="eye" />预览
        </button>
      </div>
    </div>

    <!-- JSON 工具条 -->
    <div id="json-toolbar" :class="{ open: tab && jsonInfo }">
      <span class="jt-label"><Icon name="braces" />JSON 工具</span>
      <button class="json-tool" @click="jsonFormat">格式化</button>
      <button class="json-tool" @click="jsonMinify">压缩</button>
      <button class="json-tool" @click="jsonValidate">校验</button>
      <button class="json-tool" :class="{ on: store.jsonOpen }" @click="store.jsonOpen = !store.jsonOpen">
        树状查看
      </button>
      <span class="flex-spacer"></span>
      <span class="jt-msg" :class="jsonMsg.cls">{{ jsonMsg.text }}</span>
    </div>

    <!-- 编辑区 -->
    <div v-if="tab" id="editor-body" :class="store.mode">
      <div
        v-if="store.mode !== 'preview'"
        class="cm-wrap"
        :style="cmWrapStyle"
      >
        <EditorPane
          ref="editorPane"
          :content="tab ? tab.content : ''"
          :is-markdown="!isTxt"
          @update:content="onContent"
          @cursor="onCursor"
        />
      </div>
      <div
        v-if="store.mode === 'split'"
        id="split-drag"
        :class="{ dragging: splitDragging }"
        @mousedown="startSplitDrag"
      ></div>
      <div
        v-if="store.mode !== 'edit'"
        id="editor-preview"
        class="md center"
        :style="previewStyle"
      >
        <PreviewPane :content="tab ? tab.content : ''" />
      </div>
    </div>

    <!-- 编辑器空状态 -->
    <div v-if="!tab" id="editor-empty">
      <div class="ee-ic"><Icon name="pen" /></div>
      <div class="ee-title">打开一篇笔记开始编辑</div>
      <div class="ee-sub">从左侧列表选择，或创建新笔记</div>
      <div class="ee-kbd">
        <span><kbd>Ctrl</kbd> <kbd>N</kbd> 新建</span>
        <span><kbd>Ctrl</kbd> <kbd>K</kbd> 搜索</span>
        <span><kbd>Ctrl</kbd> <kbd>Tab</kbd> 切换标签</span>
      </div>
    </div>

    <!-- JSON 树抽屉 -->
    <div v-if="store.jsonOpen && jsonValue !== undefined" id="json-drawer">
      <div class="jd-head">
        <span class="jd-title">JSON 树状视图</span>
        <button class="jd-tool" @click="treeCollapseAll">全部折叠</button>
        <button class="jd-tool" @click="treeExpandAll">全部展开</button>
        <button class="tb-btn" aria-label="关闭树状视图" @click="store.jsonOpen = false"><Icon name="x" /></button>
      </div>
      <div class="jd-body">
        <JsonTree ref="jsonTree" :json="jsonValue" />
      </div>
    </div>

    <!-- 状态栏 -->
    <div id="statusbar">
      <span class="sb-save" :class="store.saveState">
        <span class="dot"></span><span>{{ saveText }}</span>
      </span>
      <span v-if="tab" id="sb-pos">{{ cursorPos }}</span>
      <div class="sb-right">
        <button v-if="isTxt" class="sb-toggle" :class="{ on: store.wrapTxt }" @click="setWrapTxt(!store.wrapTxt)">
          <span>自动换行</span>
        </button>
        <span class="sb-lang">{{ isTxt ? '文本' : 'Markdown' }}</span>
        <span v-if="tab" class="sb-words">{{ wordCount }} 字</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import Icon from './Icon.vue';
import EditorPane from './EditorPane.vue';
import PreviewPane from './PreviewPane.vue';
import JsonTree from './JsonTree.vue';
import { store, activeTab, markDirty, createNote, closeTab, toast, setWrapTxt } from '../store.js';
import { detectJson, formatJson, minifyJson, validateJson } from '../lib/json-tools.js';
import { api } from '../lib/api.js';
import { countWords } from '../lib/utils.js';

const editorPane = ref(null);
const jsonTree = ref(null);
const jsonMsg = ref({ text: '', cls: '' });
const cursor = ref({ line: 1, col: 1 });
const splitRatio = ref(0.5);
const splitDragging = ref(false);

const tab = computed(() => activeTab());
const isTxt = computed(() => {
  const t = tab.value;
  return t ? t.path.toLowerCase().endsWith('.txt') : false;
});
const jsonInfo = computed(() => {
  const t = tab.value;
  if (!t) return null;
  return detectJson(t.content);
});
const jsonValue = computed(() => {
  const info = jsonInfo.value;
  return info ? info.json : undefined;
});
const wordCount = computed(() => (tab.value ? countWords(tab.value.content) : 0));
const saveText = computed(() => {
  if (!tab.value) return '已保存';
  return store.saveState === 'saving' ? '保存中…' : '已保存';
});
const cursorPos = computed(() => {
  const c = cursor.value;
  return `行 ${c.line}, 列 ${c.col}`;
});
const cmWrapStyle = computed(() => {
  if (store.mode !== 'split') return {};
  return { width: `${splitRatio.value * 100}%`, flex: 'none' };
});
const previewStyle = computed(() => {
  if (store.mode !== 'split') return {};
  return { width: `${(1 - splitRatio.value) * 100}%`, flex: 'none' };
});

function onContent(content) {
  if (!tab.value) return;
  tab.value.content = content;
  markDirty(tab.value.path);
}

function onCursor(pos) {
  cursor.value = pos;
}

function fmt(kind) {
  if (store.mode === 'preview') {
    store.mode = 'edit';
    nextTick(() => editorPane.value && editorPane.value.format(kind));
    return;
  }
  if (editorPane.value) editorPane.value.format(kind);
}

async function insertImage() {
  const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
  const file = await openDialog({
    multiple: false,
    title: '插入图片',
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }],
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
  const folder = store.view.type === 'folder' ? store.view.key : null;
  await createNote(folder, '新笔记', 'md');
}

function jsonFormat() {
  const t = tab.value;
  if (!t || !jsonInfo.value) return;
  const r = formatJson(jsonInfo.value.text);
  if (r.ok) {
    t.content = r.text;
    markDirty(t.path);
    jsonMsg.value = { text: '已格式化', cls: 'ok' };
  } else {
    jsonMsg.value = { text: 'JSON 无效', cls: 'err' };
  }
}
function jsonValidate() {
  const t = tab.value;
  if (!t || !jsonInfo.value) return;
  const r = validateJson(jsonInfo.value.text);
  if (r.ok) jsonMsg.value = { text: '✓ JSON 有效', cls: 'ok' };
  else jsonMsg.value = { text: `✗ 第 ${r.line} 行第 ${r.col} 列`, cls: 'err' };
}
function treeExpandAll() { if (jsonTree.value) jsonTree.value.expandAll(); }
function treeCollapseAll() { if (jsonTree.value) jsonTree.value.collapseAll(); }

function jsonMinify() {
  const t = tab.value;
  if (!t || !jsonInfo.value) return;
  const r = minifyJson(jsonInfo.value.text);
  if (r.ok) {
    t.content = r.text;
    markDirty(t.path);
    jsonMsg.value = { text: '已压缩', cls: 'ok' };
  } else {
    jsonMsg.value = { text: 'JSON 无效', cls: 'err' };
  }
}

function startSplitDrag(e) {
  if (store.mode !== 'split') return;
  e.preventDefault();
  splitDragging.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', moveSplitDrag);
  window.addEventListener('mouseup', stopSplitDrag);
}

function moveSplitDrag(e) {
  if (!splitDragging.value) return;
  const body = document.getElementById('editor-body');
  if (!body) return;
  const rect = body.getBoundingClientRect();
  let ratio = (e.clientX - rect.left) / rect.width;
  ratio = Math.max(0.15, Math.min(0.85, ratio));
  splitRatio.value = ratio;
}

function stopSplitDrag() {
  splitDragging.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  window.removeEventListener('mousemove', moveSplitDrag);
  window.removeEventListener('mouseup', stopSplitDrag);
  try { localStorage.setItem('notepad-split-ratio', String(splitRatio.value)); } catch { /* ignore */ }
}

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem('notepad-split-ratio'));
    if (!Number.isNaN(saved) && saved >= 0.15 && saved <= 0.85) splitRatio.value = saved;
  } catch { /* ignore */ }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', moveSplitDrag);
  window.removeEventListener('mouseup', stopSplitDrag);
});

watch(
  () => store.active,
  () => { jsonMsg.value = { text: '', cls: '' }; },
);
</script>

<style scoped>
.cm-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
#editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
#editor-body.edit .cm-wrap { width: 100%; }
#editor-body.preview .cm-wrap { display: none; }
#editor-body.preview #editor-preview { width: 100%; flex: none; }
#editor-body.split .cm-wrap { flex: none; }
#editor-body.split #editor-preview { flex: none; border-left: 1px solid var(--border-soft); }
#editor-preview { overflow-y: auto; }
.toolbar-hint {
  font-size: 11.5px;
  color: var(--muted);
  margin-left: 10px;
}
.jt-msg.ok { color: var(--green); font-size: 12px; }
.jt-msg.err { color: var(--danger); font-size: 12px; }
#json-drawer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 46%;
  z-index: 60;
  background: var(--bg);
  border-left: 1px solid var(--border-soft);
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.12);
}
.jd-body { flex: 1; overflow-y: auto; }
.sb-toggle.on { color: var(--accent); }
</style>
