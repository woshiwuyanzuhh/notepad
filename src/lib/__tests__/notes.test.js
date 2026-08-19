import { describe, it, expect } from 'vitest';
import { normalizeNote } from '../notes.js';

describe('normalizeNote', () => {
  it('derives title from path and fills defaults', () => {
    const n = normalizeNote({
      path: '工作/会议记录/周会纪要.md',
      mtime: 1000,
      size: 12,
      excerpt: '首行摘要',
    });
    expect(n.title).toBe('周会纪要');
    expect(n.folder).toBe('工作/会议记录');
    expect(n.tags).toEqual([]);
    expect(n.star).toBe(false);
    expect(n.pin).toBe(false);
  });
  it('keeps meta fields when present', () => {
    const n = normalizeNote({
      path: '笔记.md',
      tags: ['工作', 'API'],
      star: true,
      pin: true,
    });
    expect(n.tags).toEqual(['工作', 'API']);
    expect(n.star).toBe(true);
    expect(n.pin).toBe(true);
    expect(n.folder).toBe('');
  });
  it('handles root-level file (empty folder)', () => {
    const n = normalizeNote({ path: '根笔记.md' });
    expect(n.folder).toBe('');
  });
});
