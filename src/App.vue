<template>
  <div id="app">
    <TitleBar />

    <main id="main">
      <Sidebar />
      <NoteList />
      <EditorArea />
    </main>

    <Onboarding v-if="store.ready && !store.onboarded" />

    <div id="toast" :class="{ show: store.toastMsg }" role="status">{{ store.toastMsg }}</div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TitleBar from './components/TitleBar.vue';
import Sidebar from './components/Sidebar.vue';
import NoteList from './components/NoteList.vue';
import EditorArea from './components/EditorArea.vue';
import Onboarding from './components/Onboarding.vue';
import { store, init } from './store.js';

onMounted(() => {
  init();
});
</script>
