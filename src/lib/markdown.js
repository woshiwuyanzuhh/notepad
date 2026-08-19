// markdown.js — markdown-it + highlight.js + KaTeX 渲染

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';
import katex from 'katex';
import texmath from 'markdown-it-texmath';
import taskLists from 'markdown-it-task-lists';
import 'katex/dist/katex.min.css';
import { convertFileSrc } from '@tauri-apps/api/core';

// highlight.js class → 设计稿 tok-* class 映射
const HLJS_CLASS_MAP = {
  'hljs-keyword': 'tok-kw',
  'hljs-literal': 'tok-kw',
  'hljs-type': 'tok-kw',
  'hljs-string': 'tok-str',
  'hljs-number': 'tok-num',
  'hljs-comment': 'tok-com',
  'hljs-title': 'tok-fn',
  'hljs-title.function_': 'tok-fn',
  'hljs-function': 'tok-fn',
  'hljs-built_in': 'tok-fn',
  'hljs-variable': 'tok-fn',
  'hljs-property': 'tok-key',
  'hljs-attr': 'tok-attr',
  'hljs-attribute': 'tok-attr',
  'hljs-tag': 'tok-tag',
  'hljs-name': 'tok-tag',
  'hljs-selector-tag': 'tok-tag',
  'hljs-params': '',
  'hljs-symbol': 'tok-num',
  'hljs-meta': 'tok-com',
  'hljs-doctag': 'tok-com',
  'hljs-emphasis': '',
  'hljs-strong': '',
};

function mapHljsClass(html) {
  return html.replace(/class="(hljs-[a-z._]+)"/g, (m, cls) => {
    const mapped = HLJS_CLASS_MAP[cls];
    if (mapped === undefined) return m;
    return mapped ? `class="${mapped}"` : '';
  });
}

function highlightCode(code, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return mapHljsClass(hljs.highlight(code, { language: lang }).value);
    } catch {
      /* fall through */
    }
  }
  return escapeHtml(code);
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
});

// LaTeX 公式：$...$ 行内、$$...$$ 块级
md.use(texmath, {
  engine: katex,
  delimiters: 'dollars',
  katexOptions: { throwOnError: false, output: 'html' },
});

// 任务列表：- [x] / - [ ]
md.use(taskLists, { enabled: true, label: true, labelAfter: true });

/** 将笔记内的相对资源路径（如 assets/x.png）解析为可加载 URL */
export function resolveAssetUrl(src, baseDir) {
  if (!src || !baseDir) return src;
  if (/^(https?:|data:|blob:|asset\.localhost)/i.test(src)) return src;
  if (/^[A-Za-z]:[\\/]/.test(src)) return src; // 已是绝对路径
  const joined = baseDir.replace(/\\/g, '/').replace(/\/+$/, '') + '/' + src;
  try {
    return convertFileSrc(joined);
  } catch {
    return src;
  }
}

// 自定义图片渲染：相对路径 → 数据目录绝对资源
md.renderer.rules.image = (tokens, idx, options, env) => {
  const token = tokens[idx];
  const src = token.attrGet('src') || '';
  const alt = token.content || '';
  const baseDir = env && env.baseDir ? env.baseDir : null;
  const url = resolveAssetUrl(src, baseDir);
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy">`;
};

// 自定义 fence：设计稿 codeblock 结构（深色容器 + 语言徽章 + 复制按钮）
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = (token.info.trim().split(/\s+/)[0] || 'text').toLowerCase();
  const code = token.content;
  const highlighted = highlightCode(code, lang);
  return (
    '<div class="codeblock">' +
    '<div class="cb-head">' +
    `<span class="cb-lang">${escapeHtml(lang)}</span>` +
    `<button type="button" class="cb-copy" title="复制代码">${COPY_ICON}<span>复制</span></button>` +
    '</div>' +
    `<pre><code class="lang-${escapeHtml(lang)}">${highlighted}</code></pre>` +
    '</div>'
  );
};

/**
 * 渲染 Markdown → HTML（代码高亮、KaTeX 公式、本地图片路径解析）。
 * @param {string} src
 * @param {string|null} baseDir 数据目录绝对路径（用于解析 assets/ 图片）
 */
export function renderMarkdown(src, baseDir = null) {
  const html = md.render(String(src || ''), { baseDir });
  // 任务列表类名映射到设计稿样式（tasklist）——先替换最长的类名
  return html
    .replace(/task-list-item-checkbox/g, 'task-check')
    .replace(/task-list-item/g, 'task-item')
    .replace(/contains-task-list/g, 'tasklist');
}
