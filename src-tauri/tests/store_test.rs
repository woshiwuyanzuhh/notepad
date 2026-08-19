// store 测试：config 读写
use notepad_lib::store::{load_config_from, save_config_to, Config};

#[test]
fn config_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("config.json");
    let cfg = Config { data_dir: Some("D:/我的笔记".into()) };
    save_config_to(&path, &cfg).unwrap();
    let loaded = load_config_from(&path);
    assert_eq!(loaded.data_dir, Some("D:/我的笔记".into()));
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
