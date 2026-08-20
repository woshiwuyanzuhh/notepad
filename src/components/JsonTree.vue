<template>
  <div class="jtree">
    <JsonNode :node="json" :path="'$'" :depth="0" :open-set="openSet" @toggle="toggle" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import JsonNode from './JsonNode.vue';

const props = defineProps({
  json: { type: null, required: true },
});

const openSet = ref(new Set(['$']));

function collectPaths(node, path, out) {
  out.push(path);
  if (node && typeof node === 'object') {
    const keys = Array.isArray(node) ? node.map((_, i) => String(i)) : Object.keys(node);
    for (const k of keys) {
      collectPaths(node[k], Array.isArray(node) ? `${path}[${k}]` : `${path}.${k}`, out);
    }
  }
}
function expandAll() {
  const out = [];
  collectPaths(props.json, '$', out);
  openSet.value = new Set(out);
}
function collapseAll() {
  openSet.value = new Set(['$']);
}
function toggle(path) {
  const next = new Set(openSet.value);
  if (next.has(path)) next.delete(path); else next.add(path);
  openSet.value = next;
}

watch(
  () => props.json,
  () => { openSet.value = new Set(['$']); },
);

defineExpose({ expandAll, collapseAll });
</script>

<style scoped>
.jtree {
  font: 13px/1.85 var(--font-mono);
  padding: 14px 18px 40px;
  color: var(--fg);
}
</style>
