import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (p) => `asset://${p}`,
}));

import { renderMarkdown } from '../markdown.js';

describe('renderMarkdown basic blocks', () => {
  it('renders headings, lists, quotes, tables', () => {
    const md = '# 标题\n\n- 甲\n- 乙\n\n> 引用\n\n| A | B |\n|---|---|\n| 1 | 2 |';
    const html = renderMarkdown(md);
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<table>');
  });

  it('renders task list items', () => {
    const html = renderMarkdown('- [x] 完成\n- [ ] 待办');
    expect(html).toContain('tasklist');
    expect(html).toContain('task-check');
    expect(html).toContain('checked=""');
  });

  it('renders code fence with language badge and copy button', () => {
    const html = renderMarkdown('```python\nprint(1)\n```');
    expect(html).toContain('codeblock');
    expect(html).toContain('cb-lang">python');
    expect(html).toContain('cb-copy');
    expect(html).toMatch(/tok-[a-z]+/);
  });
});

describe('renderMarkdown KaTeX', () => {
  it('renders inline math $...$', () => {
    const html = renderMarkdown('公式 $x^2 + y^2 = z^2$ 结束');
    expect(html).toContain('katex');
    expect(html).toContain('<eq>');
  });

  it('renders block math $$...$$', () => {
    const html = renderMarkdown('$$\nE = mc^2\n$$');
    expect(html).toContain('katex-display');
  });

  it('does not crash on malformed math', () => {
    const html = renderMarkdown('$$\\frac{}{');
    expect(typeof html).toBe('string');
  });
});

describe('renderMarkdown image paths', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rewrites relative asset paths when baseDir provided', () => {
    const html = renderMarkdown('![照片](assets/photo.png)', 'D:/笔记');
    expect(html).toContain('src="asset://D:/笔记/assets/photo.png"');
    expect(html).toContain('alt="照片"');
  });

  it('keeps http and absolute paths untouched', () => {
    const html = renderMarkdown('![a](https://x.com/a.png) ![b](C:/pic/b.png)', 'D:/笔记');
    expect(html).toContain('src="https://x.com/a.png"');
    expect(html).toContain('src="C:/pic/b.png"');
  });

  it('keeps relative path when no baseDir', () => {
    const html = renderMarkdown('![a](assets/x.png)', null);
    expect(html).toContain('src="assets/x.png"');
  });
});
