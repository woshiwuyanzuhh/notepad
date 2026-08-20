// meta 测试：.notebook-meta.json 读写 / 合并 / trash 记录 / 颜色与动画
use notepad_lib::meta::{load_meta, save_meta, MetaFile, set_note_meta, add_trash_entry, remove_trash_entry, trash_records};

#[test]
fn load_returns_defaults_for_missing_file() {
    let dir = tempfile::tempdir().unwrap();
    let meta = load_meta(dir.path());
    assert!(meta.notes.is_empty());
    assert!(trash_records(&meta).is_empty());
}

#[test]
fn save_and_load_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let mut meta = MetaFile::default();
    set_note_meta(&mut meta, "工作/a.md", Some(true), Some(false), Some(vec!["工作".into()]), None, None, None);
    save_meta(dir.path(), &meta).unwrap();
    let loaded = load_meta(dir.path());
    let entry = loaded.notes.get("工作/a.md").unwrap();
    assert_eq!(entry.star, Some(true));
    assert_eq!(entry.tags.as_ref().unwrap(), &vec!["工作".to_string()]);
}

#[test]
fn set_meta_merges_without_losing_other_fields() {
    let mut meta = MetaFile::default();
    set_note_meta(&mut meta, "a.md", Some(true), None, None, None, None, None);
    set_note_meta(&mut meta, "a.md", None, Some(true), None, None, None, None);
    let e = meta.notes.get("a.md").unwrap();
    assert_eq!(e.star, Some(true));
    assert_eq!(e.pin, Some(true));
}

#[test]
fn color_and_jelly_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let mut meta = MetaFile::default();
    set_note_meta(&mut meta, "a.md", None, None, None, None, Some("#FFD9D9".into()), Some(false));
    save_meta(dir.path(), &meta).unwrap();
    let loaded = load_meta(dir.path());
    let e = loaded.notes.get("a.md").unwrap();
    assert_eq!(e.color.as_deref(), Some("#FFD9D9"));
    assert_eq!(e.jelly, Some(false));
    // 清除颜色
    let mut meta2 = loaded.clone();
    set_note_meta(&mut meta2, "a.md", None, None, None, None, Some("".into()), None);
    let e2 = meta2.notes.get("a.md").unwrap();
    assert_eq!(e2.color, Some(String::new()));
}

#[test]
fn trash_entry_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let mut meta = MetaFile::default();
    add_trash_entry(&mut meta, "旧笔记.md", "工作/旧笔记.md", 1234);
    save_meta(dir.path(), &meta).unwrap();
    let loaded = load_meta(dir.path());
    let recs = trash_records(&loaded);
    assert_eq!(recs.len(), 1);
    assert_eq!(recs[0].original, "工作/旧笔记.md");
    remove_trash_entry(&mut loaded.clone(), "旧笔记.md");
}

#[test]
fn load_tolerates_corrupt_meta() {
    let dir = tempfile::tempdir().unwrap();
    fs_write(dir.path().join(".notebook-meta.json"), "{broken json");
    let meta = load_meta(dir.path());
    assert!(meta.notes.is_empty());
}

fn fs_write(p: std::path::PathBuf, s: &str) {
    std::fs::write(p, s).unwrap();
}
