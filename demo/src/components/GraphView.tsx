import React, { useRef, useEffect, useState } from 'react'
import { NoteGraphView, GraphViewOptions, NoteGraphModel } from '../note-graph'
import useWindowResize from 'beautiful-react-hooks/useWindowResize'
import useDebouncedFn from 'beautiful-react-hooks/useDebouncedFn'

import StyleEditor from '../components/StyleEditor'

interface Props {
  graphModel: NoteGraphModel
  graphViewOptions?: Omit<GraphViewOptions, 'container'>
  showStyleEditor?: boolean
  customInitGraphView?(container: HTMLDivElement): NoteGraphView
  onGraphViewInit?(view: NoteGraphView): void
}

/**
 * A wrapper react component for the demo
 */
const GraphView = (props: Props) => {
  const graphViewWrap = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<NoteGraphView>(null)

  function initNewView() {
    if (view) {
      view.dispose()
    }

    let newView: NoteGraphView
    if (props.customInitGraphView) {
      newView = props.customInitGraphView(graphViewWrap.current)
    } else {
      newView = new NoteGraphView({
        container: graphViewWrap.current,
        graphModel: props.graphModel,
        ...(props.graphViewOptions || {}),
      })
    }
    setView(newView)
    if (props.onGraphViewInit) props.onGraphViewInit(newView)
  }

  const [style, setStyle] = useState({})

  useEffect(() => {
    initNewView()
    return () => {}
  }, [graphViewWrap])

  useEffect(() => {
    if (!view) return

    view.updateStyle(style)
  }, [style])

  useEffect(() => {
    return () => {
      if (view) view.dispose()
    }
  })

  let startTime = Date.now()
  const deboundedWindowResizeHandler = useDebouncedFn(() => {
    if (Date.now() - startTime < 2000) return
    if (view && graphViewWrap) {
      const width = graphViewWrap.current.clientWidth
      const height = graphViewWrap.current.clientHeight
      // console.log('size', width, height)
      view.updateCanvasSize({
        width,
        height,
      })
    }
  }, 300)
  useWindowResize(deboundedWindowResizeHandler)

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
