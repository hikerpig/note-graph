<template>
  <div>
    <h1>Graph Introduction</h1>
    <div class="graph-view-wrap" ref="graphViewWrap"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { NoteGraphView, Note, NoteGraphModel } from '../note-graph'

const notes: Note[] = [0, 1, 2, 3, 4, 5].map((n) => {
  return {
    id: n.toString(),
    title: `note ${n}`,
  }
})
notes[0].linkTo = ['1', '2']
notes[1].linkTo = ['2']
notes[1].referencedBy = ['0', '4']
notes[2].referencedBy = ['0', '1']
notes[4].linkTo = ['1']
notes[4].referencedBy = ['5']
const NOTE_GRAPH_MODEL_1: NoteGraphModel = new NoteGraphModel(notes)

export default defineComponent({
  name: 'GraphIntroduction',
  setup(props) {
    const graphViewWrap = ref(null)

    function initGraphView() {
      const view = new NoteGraphView({
        container: graphViewWrap.value,
      })
      view.updateViewModel(NOTE_GRAPH_MODEL_1.toGraphViewModel())
      view.initView()
    }

    onMounted(() => {
      initGraphView()
    })

    return {
      graphViewWrap,
    }
  },
})
</script>
