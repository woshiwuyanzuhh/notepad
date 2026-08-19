// 记事本 - Tauri 应用入口

pub mod commands;
pub mod fsx;
pub mod meta;
pub mod search;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::set_data_dir,
            commands::list_notes,
            commands::read_note,
            commands::write_note,
            commands::create_note,
            commands::set_note_meta,
            commands::delete_note,
            commands::list_trash,
            commands::restore_note,
            commands::purge_note,
            commands::search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
