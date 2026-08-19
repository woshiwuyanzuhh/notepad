// import_image / list_fonts 测试
use std::fs;
use notepad_lib::commands::import_image_inner;

#[test]
fn import_image_copies_into_assets() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    // 数据目录需要 .trash（模拟真实结构）
    fs::create_dir_all(root.join(".trash")).unwrap();
    let src = dir.path().join("photo.png");
    fs::write(&src, b"\x89PNG\r\n\x1a\nfake").unwrap();

    let rel = import_image_inner(root, src.to_str().unwrap()).unwrap();
    assert_eq!(rel, "assets/photo.png");
    assert!(root.join("assets/photo.png").is_file());
}

#[test]
fn import_image_dedupes_names() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join(".trash")).unwrap();
    let src = dir.path().join("photo.png");
    fs::write(&src, b"png1").unwrap();

    let rel1 = import_image_inner(root, src.to_str().unwrap()).unwrap();
    let rel2 = import_image_inner(root, src.to_str().unwrap()).unwrap();
    assert_eq!(rel1, "assets/photo.png");
    assert_eq!(rel2, "assets/photo (2).png");
}

#[test]
fn import_image_rejects_non_images_and_missing() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    fs::create_dir_all(root.join(".trash")).unwrap();

    let missing = import_image_inner(root, "C:/不存在/x.png");
    assert!(missing.is_err());

    let bad = dir.path().join("doc.exe");
    fs::write(&bad, b"MZ").unwrap();
    let err = import_image_inner(root, bad.to_str().unwrap()).unwrap_err();
    assert!(err.contains("不支持的图片格式"), "got: {err}");
}

#[cfg(windows)]
#[test]
fn list_fonts_returns_system_fonts() {
    use notepad_lib::commands::list_fonts_inner;
    let fonts = list_fonts_inner().unwrap();
    assert!(!fonts.is_empty(), "Windows 系统必有字体");
    assert!(fonts.iter().any(|f| f.to_lowercase().contains("arial")));
}
