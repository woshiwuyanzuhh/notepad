<template>
  <div ref="host" class="cm-host"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { store } from '../store.js';

const props = defineProps({
  content: { type: String, default: '' },
  isMarkdown: { type: Boolean, default: true },
});
const emit = defineEmits(['update:content']);

const host = ref(null);
let view = null;
let applyingExternal = false;

// 动态扩展槽：语言与换行通过 Compartment 切换，避免销毁重建
const langCompartment = new Compartment();
const wrapCompartment = new Compartment();

function buildExtensions() {
  const exts = [
    history(),
    highlightSelectionMatches(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
    placeholder('开始输入…'),
    notepadTheme,
    EditorView.updateListener.of((u) => {
      if (u.docChanged) {
        applyingExternal = true;
        emit('update:content', u.state.doc.toString());
        applyingExternal = false;
      }
    }),
    langCompartment.of(markdown({ codeLanguages: languages })),
    wrapCompartment.of(EditorView.lineWrapping),
  ];
  return exts;
}

function createState() {
  return EditorState.create({
    doc: props.content,
    extensions: buildExtensions(),
  });
}

function syncCompartments() {
  if (!view) return;
  const lang = props.isMarkdown ? markdown({ codeLanguages: languages }) : [];
  const wrap = props.isMarkdown || store.wrapTxt ? EditorView.lineWrapping : [];
  view.dispatch({
    effects: [
      langCompartment.reconfigure(lang),
      wrapCompartment.reconfigure(wrap),
    ],
  });
}

onMounted(() => {
  view = new EditorView({ state: createState(), parent: host.value });
  syncCompartments();
});

watch(
  () => props.content,
  (val) => {
    if (!view || view.destroyed || applyingExternal) return;
    if (view.state.doc.toString() !== val) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: val },
        selection: { anchor: 0 },
      });
    }
  },
);

watch(
  () => props.isMarkdown,
  () => {
    syncCompartments();
  },
);

watch(
  () => store.wrapTxt,
  () => {
    syncCompartments();
  },
);

const notepadTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--editor-font-size, 15px)',
    backgroundColor: 'transparent',
    color: 'var(--fg)',
  },
  '.cm-content': {
    fontFamily: 'var(--editor-font, var(--font-body))',
    lineHeight: '1.75',
    padding: '0 0 60px',
    caretColor: 'var(--accent)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--font-body)',
  },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklab, var(--accent) 22%, transparent)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--fg) 4%, transparent)' },
  '.cm-gutters': { display: 'none' },
  '.cm-line': { padding: '0 2px' },
  '.cm-placeholder': { color: 'var(--meta)' },
  '.cm-matchingBracket': { backgroundColor: 'color-mix(in oklab, var(--accent) 18%, transparent)' },
  '.ͼb': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
});

onBeforeUnmount(() => {
  if (view && !view.destroyed) view.destroy();
  view = null;
});

/* ── 格式工具：对选区包裹 / 行首插入 Markdown 语法 ── */
const WRAP = {
  bold: { pre: '**', post: '**', hint: '加粗文字' },
  italic: { pre: '*', post: '*', hint: '斜体文字' },
  code: { pre: '`', post: '`', hint: '行内代码' },
  link: { pre: '[', post: '](https://)', hint: '链接文字' },
  image: { pre: '![', post: '](图片地址)', hint: '图片描述' },
};

const LINE_PRE = {
  h1: '# ',
  h2: '## ',
  list: '- ',
  quote: '> ',
};

function aliveView() {
  if (view && !view.destroyed) return view;
  return null;
}

/** 在光标处插入文本（用于图片等自定义插入） */
function insertText(text) {
  const v = aliveView();
  if (!v) return;
  const { from } = v.state.selection.main;
  v.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  });
  v.focus();
}

function format(kind, custom) {
  const v = aliveView();
  if (!v) return;
  // 代码块围栏：整行包裹 ```lang
  if (kind === 'codeblock') {
    const { from } = v.state.selection.main;
    const line = v.state.doc.lineAt(from);
    const indent = line.text.match(/^\s*/)?.[0] || '';
    v.dispatch({
      changes: {
        from: line.from,
        insert: `${indent}\`\`\`\n${line.text.trim() || '代码'}\n${indent}\`\`\`\n`,
        to: line.to,
      },
      selection: { anchor: line.from + indent.length + 4 },
    });
    return;
  }
  const wrap = WRAP[kind];
  if (wrap) {
    const { from, to } = v.state.selection.main;
    const selected = v.state.doc.sliceString(from, to);
    const text = selected || wrap.hint;
    if (custom) {
      const [post, hint] = custom;
      const body = selected || hint;
      v.dispatch({
        changes: { from, to, insert: wrap.pre + body + post },
        selection: { anchor: from + wrap.pre.length, head: from + wrap.pre.length + body.length },
      });
      return;
    }
    v.dispatch({
      changes: { from, to, insert: wrap.pre + text + wrap.post },
      selection: { anchor: from + wrap.pre.length, head: from + wrap.pre.length + text.length },
    });
    return;
  }
  const pre = LINE_PRE[kind];
  if (pre) {
    const { from } = v.state.selection.main;
    const line = v.state.doc.lineAt(from);
    v.dispatch({
      changes: { from: line.from, insert: pre },
      selection: { anchor: from + pre.length },
    });
  }
}

defineExpose({ format, insertText });
</script>

<style>
.cm-host {
  height: 100%;
  overflow: hidden;
}
.cm-host .cm-editor {
  height: 100%;
}
</style>
