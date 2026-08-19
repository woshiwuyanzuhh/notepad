//! search.rs — 全文搜索（遍历数据目录 .md 文件）

use crate::fsx::{excerpt_of, relative_path, scan_notes};
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub struct SearchHit {
    pub path: String,
    pub snippet: String,
}

/// 在 root 下搜索 q（大小写不敏感，中文直接包含匹配）。
pub fn search_dir(root: &Path, q: &str) -> Vec<SearchHit> {
    let query = q.trim().to_lowercase();
    if query.is_empty() {
        return vec![];
    }
    let mut hits = Vec::new();
    for file in scan_notes(root) {
        let content = match std::fs::read_to_string(&file) {
            Ok(c) => c,
            Err(_) => continue,
        };
        if content.to_lowercase().contains(&query) {
            hits.push(SearchHit {
                path: relative_path(root, &file),
                snippet: make_snippet(&content, q, 40),
            });
        }
    }
    hits
}

/// 回退到最近的字符边界（向下取整）
fn floor_boundary(t: &str, mut idx: usize) -> usize {
    idx = idx.min(t.len());
    while idx > 0 && !t.is_char_boundary(idx) {
        idx -= 1;
    }
    idx
}

/// 向上取整到最近的字符边界
fn ceil_boundary(t: &str, mut idx: usize) -> usize {
    idx = idx.min(t.len());
    while idx < t.len() && !t.is_char_boundary(idx) {
        idx += 1;
    }
    idx
}

/// 生成命中摘要：定位首个命中，截取上下文窗口（字符边界安全）。
pub fn make_snippet(text: &str, q: &str, window: usize) -> String {
    let t = text.trim();
    if q.is_empty() {
        let cut: String = t.chars().take(window * 2).collect();
        return cut;
    }
    let lower = t.to_lowercase();
    let ql = q.to_lowercase();
    match lower.find(&ql) {
        Some(idx) => {
            let start = floor_boundary(t, idx.saturating_sub(window));
            let end = ceil_boundary(t, (idx + ql.len() + window).min(t.len()));
            let prefix = if start > 0 { "…" } else { "" };
            let suffix = if end < t.len() { "…" } else { "" };
            format!("{prefix}{}{suffix}", &t[start..end])
        }
        None => {
            let cut: String = t.chars().take(window * 2).collect();
            cut
        }
    }
}

/// 供 commands 使用：摘要。
pub fn excerpt(content: &str, max: usize) -> String {
    excerpt_of(content, max)
}
