import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (p) => `asset://${p}`,
}));

import { renderMarkdown } from '../markdown.js';

// 用户真实笔记内容（含插入的链接+图片语法）
const REAL = '[链接文字](https://)![图片描述](图片地址)';
const BASE = 'C:/Users/lenovo/Desktop/简历';

describe('real user content rendering', () => {
  it('renders inserted link+image without throwing', () => {
    let html = '';
    expect(() => {
      html = renderMarkdown(REAL, BASE);
    }).not.toThrow();
    expect(html).toContain('链接文字');
    expect(html).toContain('<img');
  });

  it('renders the full 146KB interview note', () => {
    // 从真实数据目录读取（存在则渲染）
    // 该文件路径含中文，用相对加载
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const file = path.join(os.homedir(), 'Desktop', '简历', 'AI模拟面试题_参考答案.md');
    if (!fs.existsSync(file)) {
      console.log('SKIP: note file not found');
      return;
    }
    const content = fs.readFileSync(file, 'utf8');
    expect(content.length).toBeGreaterThan(1000);
    let html = '';
    expect(() => {
      html = renderMarkdown(content, BASE);
    }).not.toThrow();
    expect(html.length).toBeGreaterThan(100);
  });
});
