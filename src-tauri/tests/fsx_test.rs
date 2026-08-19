// fsx 测试：路径安全 / 扫描 / 摘要
use std::fs;
use notepad_lib::fsx::{ensure_inside, scan_markdown, excerpt_of, relative_path};

#[test]
fn ensure_inside_accepts_normal_paths() {
    let root = std::path::Path::new("C:/notes");
    let ok = ensure_inside(root, std::path::Path::new("C:/notes/工作/笔记.md"));
    assert!(ok.is_ok());
}

#[test]
fn ensure_inside_rejects_escape() {
    let root = std::path::Path::new("C:/notes");
    assert!(ensure_inside(root, std::path::Path::new("C:/notes/../secret.md")).is_err());
    assert!(ensure_inside(root, std::path::Path::new("C:/Windows/system32/x.md")).is_err());
    assert!(ensure_inside(root, std::path::Path::new("D:/other/x.md")).is_err());
    assert!(ensure_inside(root, std::path::Path::new("C:/notes2/x.md")).is_err());
}

#[test]
fn scan_markdown_finds_md_files_and_skips_trash() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join("工作/会议记录")).unwrap();
    fs::create_dir_all(root.join(".trash")).unwrap();
    fs::write(root.join("工作/会议记录/a.md"), "x").unwrap();
    fs::write(root.join("b.md"), "x").unwrap();
    fs::write(root.join(".trash/old.md"), "x").unwrap();
    fs::write(root.join("note.txt"), "x").unwrap();
    let files = scan_markdown(root);
    let names: Vec<String> = files.iter().map(|p| relative_path(root, p)).collect();
    assert!(names.contains(&"工作/会议记录/a.md".to_string()));
    assert!(names.contains(&"b.md".to_string()));
    assert!(!names.iter().any(|n| n.contains(".trash")));
    assert!(!names.iter().any(|n| n.ends_with(".txt")));
    assert_eq!(names.len(), 2);
}

#[test]
fn excerpt_of_skips_markdown_syntax() {
    assert_eq!(excerpt_of("# 标题\n\n正文第一句\n第二句", 40), "正文第一句 第二句");
    assert_eq!(excerpt_of("```python\nprint(1)\n```", 40), "print(1)");
    assert_eq!(excerpt_of("   ", 40), "暂无内容");
}
