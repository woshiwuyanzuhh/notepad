// store 测试：config 读写 + 多目录
use notepad_lib::store::{load_config_from, save_config_to, remove_dir, Config};

#[test]
fn config_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("config.json");
    let mut cfg = Config {
        data_dir: Some("D:/我的笔记".into()),
        data_dirs: vec!["D:/我的笔记".into(), "D:/工作".into()],
    };
    cfg.normalize();
    save_config_to(&path, &cfg).unwrap();
    let loaded = load_config_from(&path);
    assert_eq!(loaded.data_dir, Some("D:/我的笔记".into()));
    assert_eq!(loaded.data_dirs.len(), 2);
}

#[test]
fn missing_config_returns_default() {
    let dir = tempfile::tempdir().unwrap();
    let cfg = load_config_from(&dir.path().join("nope.json"));
    assert_eq!(cfg.data_dir, None);
}

#[test]
fn corrupt_config_returns_default() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("config.json");
    std::fs::write(&path, "not json").unwrap();
    let cfg = load_config_from(&path);
    assert_eq!(cfg.data_dir, None);
}

#[test]
fn legacy_config_without_dirs_is_normalized() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("config.json");
    std::fs::write(&path, r#"{"data_dir": "C:/旧目录"}"#).unwrap();
    let cfg = load_config_from(&path);
    assert_eq!(cfg.data_dir, Some("C:/旧目录".into()));
    assert_eq!(cfg.data_dirs, vec!["C:/旧目录".to_string()]);
}

#[test]
fn remove_current_dir_switches_to_first() {
    let mut cfg = Config {
        data_dir: Some("D:/A".into()),
        data_dirs: vec!["D:/A".into(), "D:/B".into(), "D:/C".into()],
    };
    cfg.normalize();
    remove_dir(&mut cfg, "D:/A");
    assert_eq!(cfg.data_dir, Some("D:/B".into()));
    assert_eq!(cfg.data_dirs.len(), 2);
}

#[test]
fn remove_non_current_keeps_active() {
    let mut cfg = Config {
        data_dir: Some("D:/A".into()),
        data_dirs: vec!["D:/A".into(), "D:/B".into()],
    };
    cfg.normalize();
    remove_dir(&mut cfg, "D:/B");
    assert_eq!(cfg.data_dir, Some("D:/A".into()));
    assert_eq!(cfg.data_dirs, vec!["D:/A".to_string()]);
}

#[test]
fn remove_last_dir_clears_active() {
    let mut cfg = Config {
        data_dir: Some("D:/A".into()),
        data_dirs: vec!["D:/A".into()],
    };
    cfg.normalize();
    remove_dir(&mut cfg, "D:/A");
    assert_eq!(cfg.data_dir, None);
    assert!(cfg.data_dirs.is_empty());
}
