// api.js — Tauri invoke 薄封装（全部后端命令）

import { invoke } from '@tauri-apps/api/core';

export const api = {
  getConfig: () => invoke('get_config'),
  setDataDir: (path) => invoke('set_data_dir', { path }),

  listNotes: () => invoke('list_notes'),
  readNote: (path) => invoke('read_note', { path }),
  writeNote: (path, content, expectedMtime = null) =>
    invoke('write_note', { path, content, expectedMtime }),
  createNote: (folder, title) => invoke('create_note', { folder, title }),
  setNoteMeta: (path, meta) =>
    invoke('set_note_meta', {
      path,
      star: meta.star ?? null,
      pin: meta.pin ?? null,
      tags: meta.tags ?? null,
      folder: meta.folder ?? null,
    }),

  deleteNote: (path) => invoke('delete_note', { path }),
  listTrash: () => invoke('list_trash'),
  restoreNote: (name) => invoke('restore_note', { name }),
  purgeNote: (name) => invoke('purge_note', { name }),

  search: (q) => invoke('search', { q }),
};
