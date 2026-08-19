// search.js — 本地搜索过滤 / 命中高亮 / 摘要片段（纯函数）

/** HTML 转义（防注入） */
export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 过滤笔记：标题 / 正文 / 标签 任意命中（大小写不敏感）。
 * @param {Array<{title,body,tags}>} notes
 * @param {string} q
 */
export function filterNotes(notes, q) {
  const query = String(q || '').trim().toLowerCase();
  if (!query) return notes;
  return notes.filter((n) => {
    const title = String(n.title || '').toLowerCase();
    const body = String(n.body || '').toLowerCase();
    const tags = (n.tags || []).join(' ').toLowerCase();
    return title.includes(query) || body.includes(query) || tags.includes(query);
  });
}

/** 转义后包裹命中词为 <mark>。@returns HTML 字符串 */
export function markHit(text, q) {
  const escaped = escHtml(text);
  if (!q) return escaped;
  try {
    const re = new RegExp(`(${escReg(q)})`, 'gi');
    return escaped.replace(re, '<mark>$1</mark>');
  } catch {
    return escaped;
  }
}

/**
 * 生成命中摘要片段：定位首个命中，截取上下文窗口（默认前后各 40 字符）。
 * @returns 纯文本片段（未转义）
 */
export function makeSnippet(text, q, windowSize = 40) {
  const t = String(text || '');
  if (!q) return t.slice(0, windowSize * 2);
  const idx = t.toLowerCase().indexOf(String(q).toLowerCase());
  if (idx === -1) return t.slice(0, windowSize * 2);
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(t.length, idx + q.length + windowSize);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < t.length ? '…' : '';
  return prefix + t.slice(start, end) + suffix;
}
