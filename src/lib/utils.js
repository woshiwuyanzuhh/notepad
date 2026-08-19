// utils.js — 通用纯函数（相对时间/计数/防抖/路径）

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 昨天 / N 天前 / 上周 / YYYY/MM/DD */
export function relTime(ts, now = Date.now()) {
  if (!ts) return '';
  const diff = now - ts;
  if (diff < MIN) return '刚刚';
  if (diff < HOUR) return `${Math.floor(diff / MIN)} 分钟前`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`;
  if (diff < 2 * DAY) return '昨天';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`;
  if (diff < 14 * DAY) return '上周';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

/** 字数统计：中文字符数 + 英文单词数 */
export function countWords(text) {
  if (!text) return 0;
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
  return cjk + words;
}

/** 行数统计（空文本 0 行） */
export function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

/** 防抖：返回包装函数，ms 内多次调用只触发最后一次 */
export function debounce(fn, ms) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/** 从路径提取文件名（含扩展名） */
export function basename(path) {
  const parts = String(path || '').split('/');
  return parts[parts.length - 1] || '';
}

/** 从路径提取文件名（去掉 .md 扩展名） */
export function stemName(path) {
  const b = basename(path);
  return b.replace(/\.md$/i, '');
}

/** 从路径提取文件夹部分（不含文件名） */
export function dirnameOf(path) {
  const parts = String(path || '').split('/');
  parts.pop();
  return parts.join('/');
}

/** 安全文件名：去掉非法字符、trim；空则返回 未命名 */
export function safeFilename(title) {
  const cleaned = String(title || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
  return cleaned || '未命名';
}
