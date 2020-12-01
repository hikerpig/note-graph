import React, { useRef, useEffect } from 'react';
import { NoteGraphView, GraphViewOptions, NoteGraphModel } from '../note-graph'

interface Props {
  graphModel: NoteGraphModel
  graphViewOptions?: Omit<GraphViewOptions, 'container'>
}

const GraphView = (props: Props) => {
  const graphViewWrap = useRef(null)

  useEffect(() => {
    const view = new NoteGraphView({
      container: graphViewWrap.current,
      ...props.graphViewOptions || {},
    })
    view.updateViewData(props.graphModel.toGraphViewData())
    view.initView()
    return () => {
    };
  });

  return (
    <div ref={graphViewWrap} className="graph-view">
    </div>
  );
}

export default GraphView;
