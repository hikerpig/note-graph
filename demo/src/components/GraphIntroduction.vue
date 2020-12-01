<template>
<div>
  <h1>Graph Introduction</h1>
  <GraphView :graphModel="noteGraphModel" />
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { Note, NoteGraphModel } from '../note-graph'
import GraphView from '@/components/GraphView.vue'
import notes from '../data/example-notes'

export default defineComponent({
  name: 'GraphIntroduction',
  components: {
    GraphView,
  },
  props: {
    notes: {
      type: Object as () => Note[],
      default: () => notes
    }
  },
  setup(props) {
    const noteGraphModel = new NoteGraphModel(props.notes)

    return {
      noteGraphModel,
    }
  },
})
</script>
