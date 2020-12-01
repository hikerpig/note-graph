import React from 'react';
import { GraphViewOptions } from '../../../src';
import GraphView from '../components/GraphView'
import notes from '../data/example-notes'
import { Note, NoteGraphModel } from '../note-graph'

export default {
  title: 'Example',
  component: GraphView,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

type BasicProps = {
  backgroundColor: string
}

export const Basic = (props: BasicProps) => {
  const graphModel = new NoteGraphModel(notes)
  const graphViewOptions: Omit<GraphViewOptions, 'container'> = {
  }
  return <GraphView graphModel={graphModel} graphViewOptions={graphViewOptions}></GraphView>
}

Basic.args = {
  backgroundColor: '#f9f9f9'
}