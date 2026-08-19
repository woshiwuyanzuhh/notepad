// json-tools.js — JSON 检测 / 格式化 / 校验（纯函数）

/**
 * 检测文本是否为 JSON（整篇 或 ```json 围栏块）。
 * @returns {null | {kind:'full'|'fence', json:any, text:string, offset:number}}
 */
export function detectJson(text) {
  if (!text) return null;
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      return { kind: 'full', json: JSON.parse(t), text: t, offset: 0 };
    } catch {
      /* 不是合法 JSON，继续尝试围栏 */
    }
  }
  const m = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (m) {
    try {
      return { kind: 'fence', json: JSON.parse(m[1]), text: m[1], offset: m.index };
    } catch {
      return null;
    }
  }
  return null;
}

/** 格式化 JSON（2 空格缩进）。@returns {ok:true,text}|{ok:false,error} */
export function formatJson(text) {
  try {
    const json = JSON.parse(text);
    return { ok: true, text: JSON.stringify(json, null, 2) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** 校验 JSON。@returns {ok:true}|{ok:false,error,line,col} */
export function validateJson(text) {
  try {
    JSON.parse(text);
    return { ok: true };
  } catch (e) {
    const { line, col } = errorPosition(e.message);
    return { ok: false, error: e.message, line, col };
  }
}

/** 从 V8 JSON.parse 错误消息提取行/列；失败回退 1/1 */
export function errorPosition(message) {
  const m = String(message || '').match(/line (\d+) column (\d+)/);
  if (m) return { line: Number(m[1]), col: Number(m[2]) };
  return { line: 1, col: 1 };
}
