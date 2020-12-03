import React from 'react'
import { action } from '@storybook/addon-actions'
import { GraphViewOptions, NoteGraphView } from '../../../src'
import GraphView from '../components/GraphView'
import notes from 'public/data/example-notes.json'
import CONCEPT_DATA from 'public/data/concept-data.json'
import { NoteGraphModel } from '../note-graph'

export default {
  title: 'Example',
  component: GraphView,
}

export const Basic = () => {
  const graphModel = new NoteGraphModel(CONCEPT_DATA)
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

export const Interaction = () => {
  const graphModel = new NoteGraphModel(notes)
  const logNodeClick = action('nodeClick')
  const logLinkClick = action('linkClick')
  return (
    <div>
      <GraphView
        graphModel={graphModel}
        customInitGraphView={(container) => {
          const view = new NoteGraphView({
            container,
            graphModel,
          })
          view.onInteraction('nodeClick', ({ node }) => {
            logNodeClick(node)
          })
          view.onInteraction('linkClick', ({ link }) => {
            logLinkClick(link)
          })
          return view
        }}
      ></GraphView>
    </div>
  )
}
