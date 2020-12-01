<template>
<div class="graph-view-wrap" ref="graphViewWrap"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { NoteGraphView, GraphViewOptions, Note, NoteGraphModel } from '../note-graph'

export default defineComponent({
  name: 'GraphView',
  props: {
    graphModel: {
      type: Object as () => NoteGraphModel,
      required: true,
    },
    graphViewOptions: Object as () => GraphViewOptions,
  },
  setup(props) {
    const graphViewWrap = ref(null)
    function initGraphView() {
      const view = new NoteGraphView({
        container: graphViewWrap.value,
        ...props.graphViewOptions || {},
      })
      view.updateViewData(props.graphModel.toGraphViewData())
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
