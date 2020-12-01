import React from 'react'
import { GraphViewOptions } from '../../../src'
import GraphView from '../components/GraphView'
import notes from '../data/example-notes'
import { NoteGraphModel } from '../note-graph'

export default {
  title: 'Example',
  component: GraphView,
}

export const Basic = () => {
  const graphModel = new NoteGraphModel(notes)
  return (
    <div>
      <GraphView
        graphModel={graphModel}
      ></GraphView>
    </div>
  )
}


export const EnableNodeDrag = () => {
  const graphModel = new NoteGraphModel(notes)
  const graphViewOptions: Omit<GraphViewOptions, 'container'> = {
    enableForDrag: true,
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