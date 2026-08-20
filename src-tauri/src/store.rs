//! store.rs — 应用配置（工作目录）读写，位于 %APPDATA%/notepad/config.json

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct Config {
    /// 当前激活的工作目录
    pub data_dir: Option<String>,
    /// 全部已添加的工作目录（含当前）
    #[serde(default)]
    pub data_dirs: Vec<String>,
}

impl Config {
    /// 归一化：data_dirs 为空但有 data_dir 时补全（兼容旧配置）。
    pub fn normalize(&mut self) {
        if self.data_dirs.is_empty() {
            if let Some(d) = self.data_dir.clone() {
                self.data_dirs.push(d);
            }
        }
        // 确保当前目录在列表中
        if let Some(d) = self.data_dir.clone() {
            if !self.data_dirs.contains(&d) {
                self.data_dirs.insert(0, d);
            }
        }
        // 去重
        let mut seen = Vec::new();
        self.data_dirs.retain(|d| {
            if seen.contains(d) {
                false
            } else {
                seen.push(d.clone());
                true
            }
        });
    }
}

/// 默认配置路径：%APPDATA%/notepad/config.json
pub fn default_config_path() -> PathBuf {
    let base = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".into());
    Path::new(&base).join("notepad").join("config.json")
}

/// 读取配置（缺失/损坏 → 默认）。
pub fn load_config_from(path: &Path) -> Config {
    let raw = match std::fs::read_to_string(path) {
        Ok(s) => s,
        Err(_) => return Config::default(),
    };
    let mut cfg: Config = serde_json::from_str(&raw).unwrap_or_default();
    cfg.normalize();
    cfg
}

pub fn save_config_to(path: &Path, cfg: &Config) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_config() -> Config {
    load_config_from(&default_config_path())
}

pub fn save_config(cfg: &Config) -> Result<(), String> {
    save_config_to(&default_config_path(), cfg)
}

/// 从配置移除目录；若移除的是当前目录则切换到列表第一个（可能为 None）。
pub fn remove_dir(cfg: &mut Config, path: &str) {
    cfg.data_dirs.retain(|d| d != path);
    if cfg.data_dir.as_deref() == Some(path) {
        cfg.data_dir = cfg.data_dirs.first().cloned();
    }
}

/// 数据目录就绪检查：存在、可写；并确保 .trash 子目录存在。
pub fn ensure_data_dir(dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    let probe = dir.join(format!(".write-probe-{}", std::process::id()));
    std::fs::write(&probe, b"ok").map_err(|e| format!("数据目录不可写: {e}"))?;
    let _ = std::fs::remove_file(&probe);
    std::fs::create_dir_all(dir.join(".trash")).map_err(|e| e.to_string())?;
    Ok(())
}
