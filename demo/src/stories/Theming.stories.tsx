import React, { useState } from 'react'
import GraphView from '../components/GraphView'
import CONCEPT_DATA from 'public/data/concept-data.json'
import { NoteGraphModel, GraphViewOptions } from '../note-graph'
import StyleEditor from '../components/StyleEditor'

export default {
  title: 'Theming',
}

export const Style_Editor = () => {
  const graphModel = new NoteGraphModel(CONCEPT_DATA)
  const graphViewOptions: Partial<GraphViewOptions> = {
    enableNodeDrag: true,
  }

  const [style, setStyle] = useState({})
  return (
    <div>
      <h1>Style Editor</h1>
      <StyleEditor style={style} onChange={(s) => {
        setStyle(s)
      }}></StyleEditor>
      <GraphView
        graphModel={graphModel}
        style={style}
        graphViewOptions={{
          ...graphViewOptions,
          style,
        }}
      ></GraphView>
    </div>
  )
}
