import React from 'react'
import { action } from '@storybook/addon-actions'
import GraphView from '../components/GraphView'
import notes from 'public/data/example-notes.json'
import CONCEPT_DATA from 'public/data/concept-data.json'
import { GraphViewOptions, NoteGraphView, NoteGraphModel, NodeStyle, Note } from '../note-graph'

export default {
  title: 'Example',
  component: GraphView,
}

export const Basic = () => {
  const graphModel = new NoteGraphModel(CONCEPT_DATA)
  const noteGraphNode = CONCEPT_DATA.find((o) => o.title === 'Note Graph')
  return (
    <div>
      <GraphView
        graphModel={graphModel}
        onGraphViewInit={(view) => {
          if (noteGraphNode) {
            view.setSelectedNodes([noteGraphNode.id])
          }
        }}
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

export const SetSelectedNodesAndZoom = () => {
  const graphModel = new NoteGraphModel(notes)
  const noteGraphNode = notes.find((o) => o.title === 'second-brain')
  const graphViewOptions: Omit<GraphViewOptions, 'container'> = {
    enableNodeDrag: true,
  }
  return (
    <div>
      <GraphView
        graphModel={graphModel}
        graphViewOptions={graphViewOptions}
        onGraphViewInit={(view) => {
          if (noteGraphNode) {
            view.setSelectedNodes([noteGraphNode.id], { shouldZoomToFit: true })
          }
        }}
      ></GraphView>
    </div>
  )
}

export const StylingDifferentNodeTypes = () => {
  const localNotes: Note[] = CONCEPT_DATA.map((o, i) => ({
    ...o,
    type: ['JS Lib', 'Visualization'].includes(o.title) ? 'tag' : 'note',
  }))

  const graphModel = new NoteGraphModel(localNotes)
  const noteGraphNode = localNotes.find((o) => o.title === 'Note Graph')

  const tagStyle: NodeStyle = {
    regular: '#64BB00',
    lessened: 'rgba(101, 189, 0, 0.6)',
    highlighted: 'green',
  }

  const localStyle = {
    node: {
      /** Set different style for nodes with `tag` type */
      tag: tagStyle,
    },
  }
  return (
    <div>
      <GraphView
        graphModel={graphModel}
        style={localStyle}
        onGraphViewInit={(view) => {
          if (noteGraphNode) {
            view.setSelectedNodes([noteGraphNode.id])
          }
        }}
      ></GraphView>
    </div>
  )
}
