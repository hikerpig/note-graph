<template>
<div>
  <h1>Graph Introduction</h1>
  <div class="graph-view-wrap" ref="graphViewWrap"></div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { NoteGraphView, GraphViewModel } from '../note-graph'

const GRAPH_MODEL_1: Partial<GraphViewModel> = {
  data: {
    nodes: [
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ],
    links: [
      {source: 1, target: 3}
    ],
  },
  nodeInfos: {
    '1': { title: 'node 1' },
    '2': { title: 'node 2' },
    '3': { title: 'node 3' },
  }
}

export default defineComponent({
  name: 'GraphIntroduction',
  setup(props) {
    const graphViewWrap = ref(null)

    function initGraphView() {
      const view = new NoteGraphView({
        container: graphViewWrap.value,
      })
      view.updateModel(GRAPH_MODEL_1 as any)
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
