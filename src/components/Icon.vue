<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="cls"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
    <circle v-if="name === 'search'" cx="11" cy="11" r="7" />
    <circle v-if="name === 'gear'" cx="12" cy="12" r="3" />
    <circle v-if="name === 'sun'" cx="12" cy="12" r="4" />
    <circle v-if="name === 'tag'" cx="7" cy="7" r="1.4" />
    <circle v-if="name === 'list'" cx="4.5" cy="6" r="1.1" />
    <circle v-if="name === 'list'" cx="4.5" cy="12" r="1.1" />
    <circle v-if="name === 'list'" cx="4.5" cy="18" r="1.1" />
    <rect v-if="name === 'image'" x="3" y="5" width="18" height="14" rx="2" />
    <circle v-if="name === 'image'" cx="8.5" cy="10" r="1.5" />
    <rect v-if="name === 'copy'" x="9" y="9" width="11" height="11" rx="2" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  cls: { type: String, default: '' },
});

const PATHS = {
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  search: ['M21 21l-4.35-4.35'],
  plus: ['M12 5v14M5 12h14'],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  sun: ['M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'],
  gear: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  ],
  trash: ['M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'],
  star: ['M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z'],
  pin: ['M11 3h2l-.8 6.3L15 12H9l2.8-2.7z', 'M12 12v7'],
  restore: ['M3 12a9 9 0 1 0 2.6-6.3L3 8', 'M3 3v5h5'],
  folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  tag: ['M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z'],
  chevron: ['M6 9l6 6 6-6'],
  chevronL: ['M15 18l-6-6 6-6'],
  chevronR: ['M9 6l6 6-6 6'],
  x: ['M18 6L6 18M6 6l12 12'],
  check: ['M20 6L9 17l-5-5'],
  copy: ['M5 15V5a2 2 0 0 1 2-2h10'],
  bold: ['M7 4h5.5a3.5 3.5 0 0 1 0 7H7z', 'M7 11h6.5a3.5 3.5 0 0 1 0 7H7z'],
  italic: ['M10 4h6M8 20h6M13.5 4L10.5 20'],
  list: ['M9 6h11M9 12h11M9 18h11'],
  quote: ['M5 7h9M5 11h9', 'M9 15h7'],
  code: ['M8 7l-5 5 5 5M16 7l5 5-5 5'],
  link: [
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  ],
  image: ['M21 15l-5-5-9 9'],
  sidebar: ['M3 5h18v14H3z', 'M9 5v14'],
  note: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M9 13h6M9 17h6'],
};

const paths = computed(() => PATHS[props.name] || []);
</script>
