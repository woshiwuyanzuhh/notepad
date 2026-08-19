// search 测试：全文搜索
use std::fs;
use notepad_lib::search::{search_dir, make_snippet};

fn seed(root: &std::path::Path) {
    fs::create_dir_all(root.join("工作")).unwrap();
    fs::create_dir_all(root.join(".trash")).unwrap();
    fs::write(root.join("工作/a.md"), "# 周会纪要\n\n讨论了 API 接口的联调进度\n").unwrap();
    fs::write(root.join("b.md"), "Python 异步编程 async/await\n").unwrap();
    fs::write(root.join(".trash/old.md"), "包含 API 的旧笔记\n").unwrap();
}

#[test]
fn search_matches_chinese_and_skips_trash() {
    let dir = tempfile::tempdir().unwrap();
    seed(dir.path());
    let hits = search_dir(dir.path(), "API");
    assert_eq!(hits.len(), 1);
    assert_eq!(hits[0].path, "工作/a.md");
    assert!(hits[0].snippet.contains("API"));
}

#[test]
fn search_case_insensitive_english() {
    let dir = tempfile::tempdir().unwrap();
    seed(dir.path());
    let hits = search_dir(dir.path(), "PYTHON");
    assert_eq!(hits.len(), 1);
    assert_eq!(hits[0].path, "b.md");
}

#[test]
fn search_no_match_returns_empty() {
    let dir = tempfile::tempdir().unwrap();
    seed(dir.path());
    assert!(search_dir(dir.path(), "不存在的内容xyz").is_empty());
}

#[test]
fn make_snippet_centers_on_hit() {
    let text = format!("{}目标词{}", "前缀内容 ".repeat(20), " 后缀内容 ".repeat(20));
    let s = make_snippet(&text, "目标词", 20);
    assert!(s.contains("目标词"));
    assert!(s.len() < text.len());
    assert!(s.starts_with('…'));
}

#[test]
fn make_snippet_no_hit_returns_head() {
    assert_eq!(make_snippet("短文本", "xyz", 10), "短文本");
}
