<template>
  <svg class="ic" :class="cls" aria-hidden="true"><use :href="'#i-' + name" /></svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  cls: { type: String, default: '' },
});
</script>
