<template>
  <h1>Graph Introduction</h1>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { createGraphView } from '@/note-graph'

export default defineComponent({
  name: 'GraphIntroduction',
  props: {
  },
  mounted() {
    createGraphView()
  },
})
</script>
