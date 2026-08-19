<template>
  <div ref="host" class="cm-host"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
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
  ];
  if (props.isMarkdown) {
    exts.unshift(markdown({ codeLanguages: languages }));
  }
  // md 始终换行；txt 由 store.wrapTxt 决定（默认关闭 → 水平滚动）
  if (props.isMarkdown || store.wrapTxt) {
    exts.push(EditorView.lineWrapping);
  }
  return exts;
}

function createState() {
  return EditorState.create({
    doc: props.content,
    extensions: buildExtensions(),
  });
}

onMounted(() => {
  view = new EditorView({ state: createState(), parent: host.value });
});

watch(
  () => props.content,
  (val) => {
    if (!view || applyingExternal) return;
    if (view.state.doc.toString() !== val) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: val },
      });
    }
  },
);

watch(
  () => props.isMarkdown,
  () => {
    rebuild();
  },
);

watch(
  () => store.wrapTxt,
  () => {
    rebuild();
  },
);

function rebuild() {
  if (!view) return;
  const doc = view.state.doc.toString();
  const sel = view.state.selection.main;
  view.destroy();
  const state = createState();
  view = new EditorView({ state, parent: host.value });
  // 恢复文档与光标
  if (view.state.doc.toString() !== doc) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
  }
  view.dispatch({ selection: { anchor: Math.min(sel.anchor, doc.length) } });
}

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

onMounted(() => {
  view = new EditorView({
    state: EditorState.create({
      doc: props.content,
      extensions: [
        markdown({ codeLanguages: languages }),
        history(),
        highlightSelectionMatches(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        placeholder('开始输入…'),
        notepadTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            applyingExternal = true;
            emit('update:content', u.state.doc.toString());
            applyingExternal = false;
          }
        }),
      ],
    }),
    parent: host.value,
  });
});

watch(
  () => props.content,
  (val) => {
    if (!view || applyingExternal) return;
    if (view.state.doc.toString() !== val) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: val },
      });
    }
  },
);

onBeforeUnmount(() => {
  if (view) view.destroy();
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

/** 在光标处插入文本（用于图片等自定义插入） */
function insertText(text) {
  if (!view) return;
  const { from } = view.state.selection.main;
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

function format(kind, custom) {
  if (!view) return;
  const wrap = WRAP[kind];
  if (wrap) {
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    const text = selected || wrap.hint;
    if (custom) {
      const [post, hint] = custom;
      const body = selected || hint;
      view.dispatch({
        changes: { from, to, insert: wrap.pre + body + post },
        selection: { anchor: from + wrap.pre.length, head: from + wrap.pre.length + body.length },
      });
      return;
    }
    view.dispatch({
      changes: { from, to, insert: wrap.pre + text + wrap.post },
      selection: { anchor: from + wrap.pre.length, head: from + wrap.pre.length + text.length },
    });
    return;
  }
  const pre = LINE_PRE[kind];
  if (pre) {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    view.dispatch({
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
