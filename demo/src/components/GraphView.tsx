import React, { useRef, useEffect, useState } from 'react'
import { NoteGraphView, GraphViewOptions, NoteGraphModel } from '../note-graph'

import StyleEditor from '../components/StyleEditor'

interface Props {
  graphModel: NoteGraphModel
  graphViewOptions?: Omit<GraphViewOptions, 'container'>
  showStyleEditor?: boolean
  customInitGraphView?(container: HTMLDivElement): NoteGraphView
  onGraphViewInit?(view: NoteGraphView): void
}

const GraphView = (props: Props) => {
  const graphViewWrap = useRef(null)
  const [view, setView] = useState(null)

  function initView() {
    if (view) view.dispose()
    let newView: NoteGraphView
    if (props.customInitGraphView) {
      newView = props.customInitGraphView(graphViewWrap.current)
    } else {
      newView = new NoteGraphView({
        container: graphViewWrap.current,
        ...(props.graphViewOptions || {}),
      })
      newView.updateViewData(props.graphModel.toGraphViewData())
      newView.initView()
    }
    setView(newView)
    if (props.onGraphViewInit) props.onGraphViewInit(newView)
  }

  const [style, setStyle] = useState({})

  useEffect(() => {
    initView()
    return () => {
      if (view) view.dispose()
    }
  }, [graphViewWrap])

  useEffect(() => {
    if (!view) return

    view.updateStyle(style)
  }, [style])

  return (
    <div className="graph-view">
      {props.showStyleEditor ? (
        <StyleEditor style={style} onChange={(s) => setStyle(s)}></StyleEditor>
      ) : null}

      <div ref={graphViewWrap}></div>
    </div>
  )
}

export default GraphView
