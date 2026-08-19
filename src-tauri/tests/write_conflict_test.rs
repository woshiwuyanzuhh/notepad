// write_note 冲突检测测试：expectedMtime 不匹配时拒绝写入
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn ms_of(p: &std::path::Path) -> u64 {
    fs::metadata(p)
        .unwrap()
        .modified()
        .unwrap()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

/// 直接测试命令实现逻辑（通过 fsx/store 底层），避免依赖 Tauri 运行时。
#[test]
fn write_conflict_detection() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join(".trash")).unwrap();
    let file = root.join("a.md");
    fs::write(&file, "v1").unwrap();
    std::thread::sleep(std::time::Duration::from_millis(5));
    let m1 = ms_of(&file);

    // 匹配 mtime → 允许写入
    {
        let before = ms_of(&file);
        let ok = notepad_lib::commands::write_note_inner(root, "a.md", "v2", Some(before));
        assert!(ok.is_ok());
    }
    // 不匹配 → CONFLICT
    let err = notepad_lib::commands::write_note_inner(root, "a.md", "v3", Some(m1)).unwrap_err();
    assert!(err.starts_with("CONFLICT:"), "got: {err}");
    // 无 expected → 允许
    assert!(notepad_lib::commands::write_note_inner(root, "a.md", "v4", None).is_ok());
    assert_eq!(fs::read_to_string(&file).unwrap(), "v4");
}
