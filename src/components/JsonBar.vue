<template>
  <div class="jsonbar" v-if="info">
    <span class="jb-label"><Icon name="code" />JSON 工具</span>
    <button type="button" class="jb-btn" @click="onFormat">格式化 JSON</button>
    <button type="button" class="jb-btn" @click="onValidate">校验</button>
    <button type="button" class="jb-btn" :class="{ on: store.jsonOpen }" @click="toggleTree">
      树状查看
    </button>
    <span class="jb-msg" :class="msgClass">{{ msg }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { store, activeTab, toast } from '../store.js';
import { detectJson, formatJson, validateJson } from '../lib/json-tools.js';

const emit = defineEmits(['format-json']);

const info = ref(null);
const msg = ref('');
const msgClass = ref('');

function refresh() {
  const tab = activeTab();
  info.value = tab ? detectJson(tab.content) : null;
  if (!info.value) {
    msg.value = '';
    msgClass.value = '';
  }
}

// 由 EditorArea 在内容变化时调用
defineExpose({ refresh });

function onFormat() {
  const tab = activeTab();
  if (!tab || !info.value) return;
  const r = formatJson(info.value.text);
  if (r.ok) {
    emit('format-json', r.text);
    msg.value = '已格式化';
    msgClass.value = 'ok';
  } else {
    msg.value = 'JSON 无效：' + r.error;
    msgClass.value = 'err';
  }
}

function onValidate() {
  const tab = activeTab();
  if (!tab || !info.value) return;
  const r = validateJson(info.value.text);
  if (r.ok) {
    msg.value = '✓ JSON 有效';
    msgClass.value = 'ok';
  } else {
    msg.value = `✗ 第 ${r.line} 行第 ${r.col} 列：${r.error}`;
    msgClass.value = 'err';
  }
}

function toggleTree() {
  store.jsonOpen = !store.jsonOpen;
  if (!store.jsonOpen) toast('已关闭树状查看');
}
</script>
