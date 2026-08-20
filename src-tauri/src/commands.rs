//! commands.rs — Tauri commands：数据目录 / 笔记 CRUD / 元数据 / 回收站 / 搜索

use crate::fsx::{excerpt_of, relative_path, resolve, scan_notes};
use crate::meta::{
    add_trash_entry, load_meta, remove_trash_entry, save_meta, set_note_meta as set_meta_field,
    trash_records, MetaFile,
};
use crate::search::{search_dir, SearchHit};
use crate::store::{ensure_data_dir, load_config, remove_dir, save_config};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn mtime_ms(p: &Path) -> u64 {
    std::fs::metadata(p)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn data_dir() -> Result<PathBuf, String> {
    load_config()
        .data_dir
        .map(PathBuf::from)
        .ok_or_else(|| "尚未设置数据目录".to_string())
}

/// 清理文件名非法字符
fn sanitize_name(title: &str) -> String {
    let cleaned: String = title
        .chars()
        .filter(|c| !matches!(c, '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0'))
        .collect();
    let t = cleaned.trim();
    if t.is_empty() {
        "未命名".to_string()
    } else {
        t.to_string()
    }
}

/// 唯一路径：目标已存在则追加 (2)、(3)…
fn unique_path(dir: &Path, stem: &str, ext: &str) -> PathBuf {
    let mut candidate = dir.join(format!("{stem}{ext}"));
    let mut n = 2;
    while candidate.exists() {
        candidate = dir.join(format!("{stem} ({n}){ext}"));
        n += 1;
    }
    candidate
}

#[derive(Serialize)]
pub struct AppConfig {
    pub data_dir: Option<String>,
    pub data_dirs: Vec<String>,
}

#[derive(Serialize)]
pub struct NoteMeta {
    pub path: String,
    pub title: String,
    pub folder: String,
    pub tags: Vec<String>,
    pub star: bool,
    pub pin: bool,
    pub mtime: u64,
    pub size: u64,
    pub excerpt: String,
}

#[derive(Serialize)]
pub struct NoteContent {
    pub content: String,
    pub mtime: u64,
}

#[derive(Serialize)]
pub struct TrashEntryView {
    pub name: String,
    pub original: String,
    pub deleted_at: u64,
}

#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    let cfg = load_config();
    Ok(AppConfig {
        data_dir: cfg.data_dir.clone(),
        data_dirs: cfg.data_dirs.clone(),
    })
}

/// 添加并切换到工作目录（加入列表 + 设为当前）。
#[tauri::command]
pub async fn set_data_dir(path: String) -> Result<(), String> {
    let dir = PathBuf::from(&path);
    ensure_data_dir(&dir)?;
    let mut cfg = load_config();
    cfg.data_dir = Some(path.clone());
    if !cfg.data_dirs.contains(&path) {
        cfg.data_dirs.push(path);
    }
    cfg.normalize();
    save_config(&cfg)
}

/// 从工作目录列表移除；若移除的是当前目录则切换到列表第一个。
#[tauri::command]
pub async fn remove_data_dir(path: String) -> Result<(), String> {
    let mut cfg = load_config();
    remove_dir(&mut cfg, &path);
    save_config(&cfg)
}

#[tauri::command]
pub async fn list_notes() -> Result<Vec<NoteMeta>, String> {
    let root = data_dir()?;
    let meta = load_meta(&root);
    let mut out = Vec::new();
    for file in scan_notes(&root) {
        let rel = relative_path(&root, &file);
        let md = std::fs::metadata(&file).map_err(|e| e.to_string())?;
        let entry = meta.notes.get(&rel);
        let excerpt = std::fs::read(&file)
            .ok()
            .map(|b| String::from_utf8_lossy(&b[..b.len().min(8192)]).to_string())
            .map(|s| excerpt_of(&s, 80))
            .unwrap_or_default();
        out.push(NoteMeta {
            title: file
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default(),
            folder: rel
                .rsplit_once('/')
                .map(|(d, _)| d.to_string())
                .unwrap_or_default(),
            path: rel,
            tags: entry.and_then(|e| e.tags.clone()).unwrap_or_default(),
            star: entry.and_then(|e| e.star).unwrap_or(false),
            pin: entry.and_then(|e| e.pin).unwrap_or(false),
            mtime: mtime_ms(&file),
            size: md.len(),
            excerpt,
        });
    }
    out.sort_by(|a, b| b.pin.cmp(&a.pin).then(b.mtime.cmp(&a.mtime)));
    Ok(out)
}

#[tauri::command]
pub async fn read_note(path: String) -> Result<NoteContent, String> {
    let root = data_dir()?;
    let file = resolve(&root, &path)?;
    if !file.is_file() {
        return Err(format!("笔记不存在: {path}"));
    }
    let content = std::fs::read_to_string(&file).map_err(|e| e.to_string())?;
    Ok(NoteContent {
        content,
        mtime: mtime_ms(&file),
    })
}

/// 内部纯函数：写入笔记（供命令与测试复用）。expected_mtime 不匹配时返回 CONFLICT。
/// 成功返回写入后的 mtime（供前端更新冲突基线）。
pub fn write_note_inner(
    root: &Path,
    rel: &str,
    content: &str,
    expected_mtime: Option<u64>,
) -> Result<u64, String> {
    let file = resolve(root, rel)?;
    if let Some(exp) = expected_mtime {
        let cur = mtime_ms(&file);
        if cur != exp {
            return Err(format!("CONFLICT:{cur}"));
        }
    }
    std::fs::write(&file, content).map_err(|e| e.to_string())?;
    Ok(mtime_ms(&file))
}

#[tauri::command]
pub async fn write_note(
    path: String,
    content: String,
    expected_mtime: Option<u64>,
) -> Result<u64, String> {
    let root = data_dir()?;
    write_note_inner(&root, &path, &content, expected_mtime)
}

#[tauri::command]
pub async fn create_note(
    folder: Option<String>,
    title: String,
    format: Option<String>,
) -> Result<String, String> {
    let root = data_dir()?;
    let fmt = match format.as_deref() {
        Some("txt") => "txt",
        _ => "md",
    };
    let stem = sanitize_name(&title);
    let dir = match folder {
        Some(f) if !f.trim().is_empty() => resolve(&root, f.trim())?,
        _ => root.clone(),
    };
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file = unique_path(&dir, &stem, &format!(".{fmt}"));
    let body = if fmt == "md" {
        format!("# {stem}\n\n")
    } else {
        String::new()
    };
    std::fs::write(&file, body).map_err(|e| e.to_string())?;
    Ok(relative_path(&root, &file))
}

#[tauri::command]
pub async fn set_note_meta(
    path: String,
    star: Option<bool>,
    pin: Option<bool>,
    tags: Option<Vec<String>>,
    folder: Option<String>,
) -> Result<(), String> {
    let root = data_dir()?;
    let _file = resolve(&root, &path)?; // 校验路径合法
    let mut meta = load_meta(&root);
    set_meta_field(&mut meta, &path, star, pin, tags, folder);
    save_meta(&root, &meta)
}

#[tauri::command]
pub async fn delete_note(path: String) -> Result<(), String> {
    let root = data_dir()?;
    let file = resolve(&root, &path)?;
    if !file.is_file() {
        return Err(format!("笔记不存在: {path}"));
    }
    let trash_dir = root.join(".trash");
    std::fs::create_dir_all(&trash_dir).map_err(|e| e.to_string())?;
    let name = file
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "note.md".into());
    let target = unique_path(&trash_dir, name.trim_end_matches(".md"), ".md");
    let target_name = target
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    std::fs::rename(&file, &target).map_err(|e| e.to_string())?;
    let mut meta = load_meta(&root);
    add_trash_entry(&mut meta, &target_name, &path, now_ms());
    save_meta(&root, &meta)
}

#[tauri::command]
pub async fn list_trash() -> Result<Vec<TrashEntryView>, String> {
    let root = data_dir()?;
    let meta = load_meta(&root);
    let mut out: Vec<TrashEntryView> = trash_records(&meta)
        .iter()
        .map(|t| TrashEntryView {
            name: t.name.clone(),
            original: t.original.clone(),
            deleted_at: t.deleted_at,
        })
        .collect();
    // 补充磁盘上存在但无记录的（例如手工移入）
    let trash_dir = root.join(".trash");
    if let Ok(entries) = std::fs::read_dir(&trash_dir) {
        let known: Vec<String> = out.iter().map(|t| t.name.clone()).collect();
        for e in entries.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if name.ends_with(".md") && !known.contains(&name) {
                out.push(TrashEntryView {
                    name,
                    original: String::new(),
                    deleted_at: 0,
                });
            }
        }
    }
    out.sort_by_key(|t| std::cmp::Reverse(t.deleted_at));
    Ok(out)
}

#[tauri::command]
pub async fn restore_note(name: String) -> Result<(), String> {
    let root = data_dir()?;
    let src = resolve(&root, &format!(".trash/{name}"))?;
    if !src.is_file() {
        return Err(format!("回收站中不存在: {name}"));
    }
    let mut meta = load_meta(&root);
    let original = trash_records(&meta)
        .iter()
        .find(|t| t.name == name)
        .map(|t| t.original.clone())
        .unwrap_or_default();
    let target = if original.is_empty() {
        unique_path(&root, name.trim_end_matches(".md"), ".md")
    } else {
        let dir = match original.rsplit_once('/') {
            Some((d, _)) if !d.is_empty() => resolve(&root, d)?,
            _ => root.clone(),
        };
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        unique_path(
            &dir,
            original
                .rsplit('/')
                .next()
                .unwrap_or(&name)
                .trim_end_matches(".md"),
            ".md",
        )
    };
    std::fs::rename(&src, &target).map_err(|e| e.to_string())?;
    remove_trash_entry(&mut meta, &name);
    save_meta(&root, &meta)
}

#[tauri::command]
pub async fn purge_note(name: String) -> Result<(), String> {
    let root = data_dir()?;
    let src = resolve(&root, &format!(".trash/{name}"))?;
    if src.is_file() {
        std::fs::remove_file(&src).map_err(|e| e.to_string())?;
    }
    let mut meta = load_meta(&root);
    remove_trash_entry(&mut meta, &name);
    save_meta(&root, &meta)
}

#[tauri::command]
pub async fn search(q: String) -> Result<Vec<SearchHit>, String> {
    let root = data_dir()?;
    Ok(search_dir(&root, &q))
}

/// 内部纯函数：导入图片到数据目录 assets/，返回相对路径（如 assets/xx.png）。
pub fn import_image_inner(root: &Path, source: &str) -> Result<String, String> {
    let src = PathBuf::from(source);
    if !src.is_file() {
        return Err("图片文件不存在".to_string());
    }
    let ext = src
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    if !matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp" | "svg") {
        return Err(format!("不支持的图片格式: {ext}"));
    }
    let assets = root.join("assets");
    std::fs::create_dir_all(&assets).map_err(|e| e.to_string())?;
    let stem = src
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "image".into());
    let target = unique_path(&assets, &stem, &format!(".{ext}"));
    std::fs::copy(&src, &target).map_err(|e| e.to_string())?;
    Ok(relative_path(root, &target))
}

#[tauri::command]
pub async fn import_image(source: String) -> Result<String, String> {
    let root = data_dir()?;
    import_image_inner(&root, &source)
}

/// 枚举本机已安装字体（注册表 Fonts 键），返回字体族名列表。
#[cfg(windows)]
pub fn list_fonts_inner() -> Result<Vec<String>, String> {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ};
    use winreg::RegKey;

    let mut names: Vec<String> = Vec::new();
    let subkey = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts";
    for hive in [
        RegKey::predef(HKEY_LOCAL_MACHINE),
        RegKey::predef(HKEY_CURRENT_USER),
    ] {
        if let Ok(key) = hive.open_subkey_with_flags(subkey, KEY_READ) {
            for v in key.enum_values().flatten() {
                let full = v.0;
                let name = full
                    .trim_end_matches(" (TrueType)")
                    .trim_end_matches(" (OpenType)")
                    .trim_end_matches(" (All res)")
                    .trim_end_matches(" (VGA res)")
                    .trim_end_matches(" (FIXED res)")
                    .to_string();
                if !name.is_empty() && !names.contains(&name) {
                    names.push(name);
                }
            }
        }
    }
    names.sort_by_key(|s| s.to_lowercase());
    Ok(names)
}

#[cfg(windows)]
#[tauri::command]
pub async fn list_fonts() -> Result<Vec<String>, String> {
    list_fonts_inner()
}

#[cfg(not(windows))]
pub fn list_fonts_inner() -> Result<Vec<String>, String> {
    Ok(vec!["系统默认".to_string()])
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn list_fonts() -> Result<Vec<String>, String> {
    list_fonts_inner()
}

// 供测试复用：内部状态清理
#[allow(dead_code)]
pub fn _reset_config() {
    let _ = save_config(&crate::store::Config::default());
}

// 保持 MetaFile 类型可见（测试引用）
#[allow(dead_code)]
pub type _Meta = MetaFile;
