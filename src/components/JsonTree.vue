<template>
  <div class="jsonview">
    <div class="jv-head">
      <span class="jv-title"><Icon name="code" />JSON 树状视图</span>
      <span class="jv-actions">
        <button type="button" class="jv-btn" @click="expandAll">全部展开</button>
        <button type="button" class="jv-btn" @click="collapseAll">全部收起</button>
        <button type="button" class="jv-btn" @click="store.jsonOpen = false">关闭</button>
      </span>
    </div>
    <div class="jtree">
      <JsonNode :node="json" :path="'$'" :depth="0" :open-set="openSet" @toggle="toggle" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import JsonNode from './JsonNode.vue';
import { store } from '../store.js';

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
  if (next.has(path)) next.delete(path);
  else next.add(path);
  openSet.value = next;
}

watch(
  () => props.json,
  () => {
    openSet.value = new Set(['$']);
  },
);
</script>
