<template>
  <span class="jt-node">
    <span v-if="isContainer" class="jt-row">
      <button type="button" class="jt-caret" :class="{ closed: !isOpen }" @click="emit('toggle', path)">
        <Icon name="chev-r" />
      </button>
      <span class="jt-bracket">{{ isArray ? '[' : '{' }}</span>
      <span class="jt-hint">{{ isArray ? `${keys.length} 项` : `${keys.length} 个键` }}</span>
    </span>
    <template v-if="isContainer">
      <span class="jt-children" :class="{ closed: !isOpen }">
        <span v-for="k in keys" :key="k" class="jt-entry">
          <span v-if="isArray" class="jt-idx">{{ k }}</span>
          <span v-else class="jt-key">"{{ k }}"</span>
          <span class="jt-punct">: </span>
          <JsonNode
            :node="node[k]"
            :path="isArray ? `${path}[${k}]` : `${path}.${k}`"
            :depth="depth + 1"
            :open-set="openSet"
            @toggle="emit('toggle', $event)"
          />
        </span>
      </span>
    </template>
    <template v-else>
      <span v-if="node === null" class="jt-null">null</span>
      <span v-else-if="typeof node === 'boolean'" class="jt-bool">{{ node }}</span>
      <span v-else-if="typeof node === 'number'" class="jt-num">{{ node }}</span>
      <span v-else class="jt-str">"{{ node }}"</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  node: { type: null, required: true },
  path: { type: String, required: true },
  depth: { type: Number, default: 0 },
  openSet: { type: Set, required: true },
});

const emit = defineEmits(['toggle']);

const isContainer = computed(() => props.node !== null && typeof props.node === 'object');
const isArray = computed(() => Array.isArray(props.node));
const keys = computed(() => {
  if (!isContainer.value) return [];
  return isArray.value ? props.node.map((_, i) => String(i)) : Object.keys(props.node);
});
const isOpen = computed(() => props.openSet.has(props.path));
</script>
