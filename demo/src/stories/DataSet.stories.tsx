import React from 'react'
import GraphView from '../components/GraphView'
import FOAM_NOTES from '../data/foam-notes.json'
import { NoteGraphModel, GraphViewOptions } from '../note-graph'

export default {
  title: 'Other Datasets',
  component: GraphView,
}

export const Foam = () => {
  const graphModel = new NoteGraphModel(FOAM_NOTES)
  const graphViewOptions: Partial<GraphViewOptions> = {
    enableNodeDrag: true,
  }
  return (
    <div>
      <GraphView
        graphModel={graphModel}
        graphViewOptions={graphViewOptions}
      ></GraphView>
    </div>
  )
}
