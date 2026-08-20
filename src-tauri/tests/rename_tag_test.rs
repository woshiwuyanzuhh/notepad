// rename / tag 管理测试
use std::fs;
use notepad_lib::commands::{rename_note_inner, rename_tag_inner, delete_tag_inner};
use notepad_lib::meta::{load_meta, set_note_meta};

fn seed(root: &std::path::Path) {
    fs::create_dir_all(root.join(".trash")).unwrap();
    fs::create_dir_all(root.join("工作")).unwrap();
    fs::write(root.join("工作/旧名.md"), "# 内容").unwrap();
    fs::write(root.join("a.md"), "x").unwrap();
    let mut meta = notepad_lib::meta::MetaFile::default();
    set_note_meta(&mut meta, "工作/旧名.md", None, None, Some(vec!["工作".into(), "重要".into()]), None, None, None);
    set_note_meta(&mut meta, "a.md", None, None, Some(vec!["重要".into()]), None, None, None);
    notepad_lib::meta::save_meta(root, &meta).unwrap();
}

#[test]
fn rename_note_keeps_extension_and_moves_meta() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    seed(root);
    let new_rel = rename_note_inner(root, "工作/旧名.md", "新标题").unwrap();
    assert_eq!(new_rel, "工作/新标题.md");
    assert!(root.join("工作/新标题.md").is_file());
    assert!(!root.join("工作/旧名.md").exists());
    // meta 键迁移
    let meta = load_meta(root);
    assert!(meta.notes.contains_key("工作/新标题.md"));
    assert!(!meta.notes.contains_key("工作/旧名.md"));
    let entry = meta.notes.get("工作/新标题.md").unwrap();
    assert_eq!(entry.tags.as_ref().unwrap(), &vec!["工作".to_string(), "重要".to_string()]);
}

#[test]
fn rename_note_handles_txt_and_conflicts() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join(".trash")).unwrap();
    fs::write(root.join("a.txt"), "x").unwrap();
    fs::write(root.join("目标.txt"), "y").unwrap();
    let rel = rename_note_inner(root, "a.txt", "目标").unwrap();
    assert_eq!(rel, "目标 (2).txt");
    assert!(root.join("目标 (2).txt").is_file());
}

#[test]
fn rename_tag_updates_all_notes() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    seed(root);
    rename_tag_inner(root, "重要", "核心").unwrap();
    let meta = load_meta(root);
    let e1 = meta.notes.get("工作/旧名.md").unwrap();
    let e2 = meta.notes.get("a.md").unwrap();
    assert!(e1.tags.as_ref().unwrap().contains(&"核心".to_string()));
    assert!(!e1.tags.as_ref().unwrap().contains(&"重要".to_string()));
    assert!(e2.tags.as_ref().unwrap().contains(&"核心".to_string()));
}

#[test]
fn delete_tag_removes_from_all_notes() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    seed(root);
    delete_tag_inner(root, "重要").unwrap();
    let meta = load_meta(root);
    let e1 = meta.notes.get("工作/旧名.md").unwrap();
    let e2 = meta.notes.get("a.md").unwrap();
    assert_eq!(e1.tags.as_ref().unwrap(), &vec!["工作".to_string()]);
    assert!(e2.tags.is_none() || e2.tags.as_ref().unwrap().is_empty());
}

#[test]
fn rename_note_rejects_missing() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join(".trash")).unwrap();
    assert!(rename_note_inner(root, "不存在.md", "x").is_err());
}
