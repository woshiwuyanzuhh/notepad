import { describe, it, expect } from 'vitest';
import { detectJson, formatJson, validateJson, errorPosition } from '../json-tools.js';

describe('detectJson', () => {
  it('detects whole-document JSON object', () => {
    const r = detectJson('{\n  "name": "张三",\n  "age": 30\n}');
    expect(r.kind).toBe('full');
    expect(r.json.name).toBe('张三');
  });
  it('detects whole-document JSON array', () => {
    expect(detectJson('[1, 2, 3]').kind).toBe('full');
  });
  it('detects JSON inside ```json fence', () => {
    const text = '# 接口返回\n\n```json\n{"code": 0, "data": [1]}\n```\n\n结尾';
    const r = detectJson(text);
    expect(r.kind).toBe('fence');
    expect(r.json.code).toBe(0);
    expect(r.offset).toBeGreaterThan(0);
  });
  it('returns null for non-JSON', () => {
    expect(detectJson('# 普通笔记\n\n一些文字')).toBeNull();
    expect(detectJson('')).toBeNull();
  });
});

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    const r = formatJson('{"a":1,"b":[1,2]}');
    expect(r.ok).toBe(true);
    expect(r.text).toContain('"a": 1');
    expect(r.text).toContain('\n');
  });
  it('reports error for invalid JSON', () => {
    const r = formatJson('{"a": }');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe('validateJson', () => {
  it('valid JSON passes', () => {
    expect(validateJson('{"ok": true}').ok).toBe(true);
  });
  it('invalid JSON fails with message', () => {
    const r = validateJson('{"a": 1,}');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe('errorPosition', () => {
  it('extracts line/column from V8 error message', () => {
    const { line, col } = errorPosition('Unexpected token } in JSON at position 10 (line 2 column 3)');
    expect(line).toBe(2);
    expect(col).toBe(3);
  });
  it('falls back to 1/1', () => {
    const { line, col } = errorPosition('Something else');
    expect(line).toBe(1);
    expect(col).toBe(1);
  });
});
