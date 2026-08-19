// notes.js — 笔记模型归一化（后端响应 → 前端模型）

import { stemName, dirnameOf } from './utils.js';

/**
 * 归一化后端返回的笔记元数据。
 * @param {object} raw — {path, title?, folder?, tags?, star?, pin?, mtime?, size?, excerpt?}
 * @returns {path,title,folder,tags,star,pin,mtime,size,excerpt}
 */
export function normalizeNote(raw) {
  const path = String(raw.path || '');
  return {
    path,
    title: raw.title || stemName(path),
    folder: raw.folder ?? dirnameOf(path),
    tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],
    star: Boolean(raw.star),
    pin: Boolean(raw.pin),
    mtime: Number(raw.mtime) || 0,
    size: Number(raw.size) || 0,
    excerpt: raw.excerpt || '',
  };
}

/** 归一化一组笔记并按 置顶→mtime 排序 */
export function normalizeNotes(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeNote)
    .sort((a, b) => (b.pin - a.pin) || (b.mtime - a.mtime));
}
