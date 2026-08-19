import { describe, it, expect } from 'vitest';
import { relTime, countWords, countLines, debounce, basename, stemName, safeFilename } from '../utils.js';

describe('relTime', () => {
  const now = Date.now();
  it('刚刚 for < 1 minute', () => {
    expect(relTime(now - 10 * 1000, now)).toBe('刚刚');
  });
  it('N 分钟前 for < 1 hour', () => {
    expect(relTime(now - 3 * 60 * 1000, now)).toBe('3 分钟前');
  });
  it('N 小时前 for < 24 hours', () => {
    expect(relTime(now - 5 * 3600 * 1000, now)).toBe('5 小时前');
  });
  it('昨天 for < 48 hours', () => {
    expect(relTime(now - 30 * 3600 * 1000, now)).toBe('昨天');
  });
  it('N 天前 for < 7 days', () => {
    expect(relTime(now - 3 * 24 * 3600 * 1000, now)).toBe('3 天前');
  });
  it('上周 for < 14 days', () => {
    expect(relTime(now - 9 * 24 * 3600 * 1000, now)).toBe('上周');
  });
  it('date string for older', () => {
    const old = new Date(2024, 0, 15).getTime();
    expect(relTime(old, now)).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });
});

describe('countWords / countLines', () => {
  it('counts Chinese chars + English words', () => {
    expect(countWords('你好世界 hello world')).toBe(6); // 4 CJK + 2 words
  });
  it('counts lines', () => {
    expect(countLines('a\nb\nc')).toBe(3);
    expect(countLines('')).toBe(0);
  });
});

describe('debounce', () => {
  it('only fires once after rapid calls', async () => {
    let n = 0;
    const fn = debounce(() => { n += 1; }, 30);
    fn(); fn(); fn();
    await new Promise((r) => setTimeout(r, 60));
    expect(n).toBe(1);
  });
});

describe('path helpers', () => {
  it('basename and stemName', () => {
    expect(basename('工作/会议记录/周会纪要.md')).toBe('周会纪要.md');
    expect(stemName('工作/会议记录/周会纪要.md')).toBe('周会纪要');
    expect(stemName('无路径笔记.md')).toBe('无路径笔记');
  });
  it('safeFilename strips illegal chars and trims', () => {
    expect(safeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
    expect(safeFilename('  标题  ')).toBe('标题');
    expect(safeFilename('   ')).toBe('未命名');
  });
});
