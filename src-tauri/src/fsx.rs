//! fsx.rs — 路径安全校验 / Markdown 扫描 / 摘要提取

use std::path::{Component, Path, PathBuf};

/// 校验 path 位于 root 内，返回规范化后的绝对路径；越界返回 Err。
pub fn ensure_inside(root: &Path, path: &Path) -> Result<PathBuf, String> {
    let root_abs = absolutize(root);
    let path_abs = absolutize(path);
    if !path_abs.starts_with(&root_abs) {
        return Err(format!("path escapes data dir: {}", path.display()));
    }
    Ok(path_abs)
}

fn absolutize(p: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in p.components() {
        match comp {
            Component::Normal(c) => out.push(c),
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            Component::RootDir => out.push(Path::new(if cfg!(windows) { "C:\\" } else { "/" })),
            Component::Prefix(pre) => out.push(pre.as_os_str()),
        }
    }
    out
}

/// 递归扫描 root 下所有 .md 文件（排除 .trash 与隐藏目录），返回相对路径（正斜杠）。
pub fn scan_markdown(root: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = match std::fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            if path.is_dir() {
                stack.push(path);
            } else if name.ends_with(".md") {
                out.push(path);
            }
        }
    }
    out.sort();
    out
}

/// 提取首行非空正文作为摘要：去 Markdown 语法标记，超长截断。
pub fn excerpt_of(content: &str, max: usize) -> String {
    let mut seen = String::new();
    for line in content.lines() {
        let t = line
            .trim()
            .trim_start_matches(|c| c == '#' || c == ' ' || c == '>' || c == '-' || c == '*' || c == '`')
            .trim();
        if !t.is_empty() && !t.starts_with("```") {
            seen.push_str(t);
            seen.push(' ');
        }
        if seen.trim().len() >= max {
            break;
        }
    }
    let trimmed = seen.trim();
    if trimmed.is_empty() {
        return "暂无内容".to_string();
    }
    if trimmed.chars().count() > max {
        let cut: String = trimmed.chars().take(max).collect();
        return format!("{}…", cut.trim_end());
    }
    trimmed.to_string()
}

/// root 下路径转相对字符串（正斜杠）。
pub fn relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

/// root 下相对字符串转绝对路径（校验在内）。
pub fn resolve(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let joined = root.join(rel.replace('/', std::path::MAIN_SEPARATOR_STR));
    ensure_inside(root, &joined)
}
