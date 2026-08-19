//! meta.rs — .notebook-meta.json：笔记元数据（star/pin/tags/folder）+ 回收站记录

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::Path;

pub const META_FILE: &str = ".notebook-meta.json";

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NoteMetaEntry {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub star: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pin: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct TrashEntry {
    pub name: String,
    pub original: String,
    pub deleted_at: u64,
}

#[derive(Serialize, Deserialize, Default)]
pub struct MetaFile {
    #[serde(default)]
    pub version: u32,
    #[serde(default)]
    pub notes: BTreeMap<String, NoteMetaEntry>,
    #[serde(default)]
    pub trash: Vec<TrashEntry>,
}

pub fn meta_path(root: &Path) -> std::path::PathBuf {
    root.join(META_FILE)
}

/// 读取元数据；文件缺失或损坏时返回默认空结构。
pub fn load_meta(root: &Path) -> MetaFile {
    let raw = match std::fs::read_to_string(meta_path(root)) {
        Ok(s) => s,
        Err(_) => return MetaFile::default(),
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

/// 原子写入元数据（临时文件 + rename）。
pub fn save_meta(root: &Path, meta: &MetaFile) -> Result<(), String> {
    let path = meta_path(root);
    let tmp = root.join(format!(".notebook-meta.json.tmp{}", std::process::id()));
    let json = serde_json::to_string_pretty(meta).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

/// 局部更新单条笔记元数据（None 表示不改动该字段）。
pub fn set_note_meta(
    meta: &mut MetaFile,
    rel: &str,
    star: Option<bool>,
    pin: Option<bool>,
    tags: Option<Vec<String>>,
    folder: Option<String>,
) {
    let entry = meta.notes.entry(rel.to_string()).or_default();
    if star.is_some() {
        entry.star = star;
    }
    if pin.is_some() {
        entry.pin = pin;
    }
    if tags.is_some() {
        entry.tags = tags;
    }
    if folder.is_some() {
        entry.folder = folder;
    }
    // 全空则移除条目，保持文件干净
    if entry.star.is_none() && entry.pin.is_none() && entry.tags.is_none() && entry.folder.is_none() {
        meta.notes.remove(rel);
    }
}

/// 读取单条元数据（缺省返回空）。
pub fn get_note_meta<'a>(meta: &'a MetaFile, rel: &str) -> Option<&'a NoteMetaEntry> {
    meta.notes.get(rel)
}

pub fn add_trash_entry(meta: &mut MetaFile, name: &str, original: &str, deleted_at: u64) {
    meta.trash.retain(|t| t.name != name);
    meta.trash.push(TrashEntry {
        name: name.to_string(),
        original: original.to_string(),
        deleted_at,
    });
}

pub fn remove_trash_entry(meta: &mut MetaFile, name: &str) -> Option<TrashEntry> {
    let idx = meta.trash.iter().position(|t| t.name == name)?;
    Some(meta.trash.remove(idx))
}

pub fn trash_records(meta: &MetaFile) -> &[TrashEntry] {
    &meta.trash
}
