import { describe, it, expect } from 'vitest';
import { filterNotes, markHit, makeSnippet, escHtml } from '../search.js';

const notes = [
  { path: '工作/周会纪要.md', title: '周会纪要', body: '讨论了 API 接口的进度', tags: ['工作'] },
  { path: '学习/Python笔记.md', title: 'Python 笔记', body: 'async/await 异步编程', tags: ['学习'] },
  { path: '生活/爬山清单.md', title: '爬山清单', body: '带水、零食、充电宝', tags: ['灵感'] },
];

describe('filterNotes', () => {
  it('matches title case-insensitively', () => {
    expect(filterNotes(notes, 'python').map((n) => n.title)).toEqual(['Python 笔记']);
  });
  it('matches body content (Chinese)', () => {
    expect(filterNotes(notes, '异步').map((n) => n.title)).toEqual(['Python 笔记']);
  });
  it('matches tags', () => {
    expect(filterNotes(notes, '灵感').map((n) => n.title)).toEqual(['爬山清单']);
  });
  it('empty query returns all', () => {
    expect(filterNotes(notes, '').length).toBe(3);
  });
  it('no match returns empty', () => {
    expect(filterNotes(notes, '不存在的词xyz').length).toBe(0);
  });
});

describe('escHtml / markHit', () => {
  it('escapes HTML in markHit', () => {
    const out = markHit('<script>alert(1)</script>', 'script');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;<mark>script</mark>&gt;');
    expect(out).toContain('<mark>script</mark>');
  });
  it('markHit without query returns escaped text', () => {
    expect(markHit('<b>x</b>', '')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });
  it('escHtml escapes all five entities', () => {
    expect(escHtml('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;');
  });
});

describe('makeSnippet', () => {
  it('centers window on first hit', () => {
    const body = '第一行内容 '.repeat(30) + '目标关键词' + ' 后续内容 '.repeat(30);
    const s = makeSnippet(body, '目标关键词');
    expect(s).toContain('目标关键词');
    expect(s.length).toBeLessThan(body.length);
  });
  it('returns head when no hit', () => {
    const s = makeSnippet('短文本', 'xyz');
    expect(s).toBe('短文本');
  });
});
