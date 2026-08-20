<template>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-vault" viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9z"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-chev-d" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
    <symbol id="i-chev-r" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
    <symbol id="i-all" viewBox="0 0 24 24"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 9h8M8 12.5h8M8 16h5"/></symbol>
    <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></symbol>
    <symbol id="i-star-f" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
    <symbol id="i-tag" viewBox="0 0 24 24"><path d="M3.5 12.5l8-8h6a3 3 0 0 1 3 3v6l-8 8a2.5 2.5 0 0 1-3.5 0l-5.5-5.5a2.5 2.5 0 0 1 0-3.5z"/><circle cx="15.5" cy="8.5" r="1.4"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12"/></symbol>
    <symbol id="i-restore" viewBox="0 0 24 24"><path d="M4 10a8 8 0 0 1 14-3.5M20 14a8 8 0 0 1-14 3.5"/><path d="M18 3v4h-4M6 21v-4h4"/></symbol>
    <symbol id="i-trash-x" viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12"/><path d="M9.5 11.5l5 5M14.5 11.5l-5 5"/></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M9 4h6l-.6 5.4 3 3.6H6.6l3-3.6L9 4zM12 13v7"/></symbol>
    <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9z"/></symbol>
    <symbol id="i-file-md" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3z"/><path d="M14 3v4h4"/><path d="M9 13l1.5 4L12 13l1.5 4L15 13"/></symbol>
    <symbol id="i-file-txt" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3z"/><path d="M14 3v4h4"/><path d="M9.5 13h5M12 13v4"/></symbol>
    <symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20l1-4.5L16.5 4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19 4 20z"/></symbol>
    <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></symbol>
    <symbol id="i-split" viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M12 4v16"/></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>
    <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></symbol>
    <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.2 2.4 2.6.6 1.8-1.8 2 2-1.8 1.8.6 2.6 2.4 1.2v2.8l-2.4 1.2-.6 2.6 1.8 1.8-2 2-1.8-1.8-2.6.6-1.2 2.4H9.2L8 19.6l-2.6-.6-1.8 1.8-2-2 1.8-1.8-.6-2.6L.4 13v-2.8l2.4-1.2.6-2.6-1.8-1.8 2-2L5.4 5l2.6-.6L9.2 2z" transform="translate(2.6 2.8) scale(.78)"/></symbol>
    <symbol id="i-win-min" viewBox="0 0 24 24"><path d="M4 12h16"/></symbol>
    <symbol id="i-win-max" viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="1.5"/></symbol>
    <symbol id="i-win-close" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></symbol>
    <symbol id="i-expand" viewBox="0 0 24 24"><path d="M4 9V4h5M20 15v5h-5M4 15v5h5M20 9V4h-5"/></symbol>
    <symbol id="i-collapse" viewBox="0 0 24 24"><path d="M9 4v5H4M15 20v-5h5M9 20v-5H4M15 4v5h5"/></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></symbol>
    <symbol id="i-bold" viewBox="0 0 24 24"><path d="M7 4.5h6a3.5 3.5 0 0 1 0 7H7v-7zM7 11.5h6.5a3.5 3.5 0 0 1 0 7H7v-7z"/></symbol>
    <symbol id="i-italic" viewBox="0 0 24 24"><path d="M10 4.5h7M7 19.5h7M14 4.5l-4 15"/></symbol>
    <symbol id="i-quote" viewBox="0 0 24 24"><path d="M5 10.5A4.5 4.5 0 0 1 9.5 15H4v4.5H9V15A4.5 4.5 0 0 1 5 10.5zM14 10.5A4.5 4.5 0 0 1 18.5 15H13v4.5h5V15a4.5 4.5 0 0 1-4-4.5z" transform="translate(-1.5)"/></symbol>
    <symbol id="i-code" viewBox="0 0 24 24"><path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5"/></symbol>
    <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7"/><path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7"/></symbol>
    <symbol id="i-image" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3.5 17l5-5 4 4 3-3 5 5"/></symbol>
    <symbol id="i-list-ul" viewBox="0 0 24 24"><circle cx="5" cy="6.5" r="1.3"/><circle cx="5" cy="12" r="1.3"/><circle cx="5" cy="17.5" r="1.3"/><path d="M10 6.5h9M10 12h9M10 17.5h9"/></symbol>
    <symbol id="i-h1" viewBox="0 0 24 24"><path d="M4 5.5v13M11 5.5v13M4 12h7"/><path d="M17 18.5v-9l-2.5 1.8"/></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></symbol>
    <symbol id="i-braces" viewBox="0 0 24 24"><path d="M8 4C6 4 5.5 5.5 5.5 7.5S5 12 4 12c1 0 1.5 2.5 1.5 4.5S6 20 8 20M16 4c2 0 2.5 1.5 2.5 3.5S19 12 20 12c-1 0-1.5 2.5-1.5 4.5S18 20 16 20"/></symbol>
    <symbol id="i-tree" viewBox="0 0 24 24"><path d="M12 3v6M12 9l-5 4M12 9l5 4M7 13v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-2"/><path d="M12 13v3"/></symbol>
    <symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 4L2.8 19.5h18.4L12 4z"/><path d="M12 10v4.5M12 17.3v.2"/></symbol>
    <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></symbol>
    <symbol id="i-mono" viewBox="0 0 24 24"><path d="M4 7h4M16 7h4M12 5.5v13M9 18.5h6"/></symbol>
    <symbol id="i-trash-all" viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12M9.5 11v5.5M14.5 11v5.5"/></symbol>
    <symbol id="i-jelly" viewBox="0 0 24 24"><path d="M12 4c4 0 6.5 2.8 6.5 6 0 2.6-1.6 4.8-4 5.8L13 19.5l-2.4-3.2c-3-.8-5.1-3.2-5.1-6.3C5.5 6.8 8 4 12 4z"/><path d="M8.2 8.8h7.6M8.2 12h3.8"/></symbol>
    <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 3.5V8h-4.5"/></symbol>
  </defs>
  </svg>
</template>
