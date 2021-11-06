import React, { useRef, useEffect, useState } from 'react'
import { NoteGraphView, GraphViewOptions, NoteGraphModel } from '../note-graph'
import useWindowResize from 'beautiful-react-hooks/useWindowResize'
import useDebouncedFn from 'beautiful-react-hooks/useDebouncedFn'

interface Props {
  graphModel: NoteGraphModel
  style?: any
  graphViewOptions?: Omit<GraphViewOptions, 'container'>
  customInitGraphView?(container: HTMLDivElement): NoteGraphView
  onGraphViewInit?(view: NoteGraphView): void
}

/**
 * A wrapper react component for the demo
 */
const GraphView = (props: Props) => {
  const { style } = props
  const graphViewWrap = useRef<HTMLDivElement>(null)
  const viewRef = useRef<NoteGraphView>(null)

  function initNewView() {
    if (viewRef.current) {
      viewRef.current.dispose()
    }

    let newView: NoteGraphView
    if (props.customInitGraphView) {
      newView = props.customInitGraphView(graphViewWrap.current)
    } else {
      newView = new NoteGraphView({
        container: graphViewWrap.current,
        graphModel: props.graphModel,
        style,
        ...(props.graphViewOptions || {}),
      })
    }
    viewRef.current = newView
    if (props.onGraphViewInit) props.onGraphViewInit(newView)
  }

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.updateStyle(style)
    }
    return () => {
    };
  }, [style]);

  useEffect(() => {
    initNewView()
    return () => {}
  }, [graphViewWrap])

  useEffect(() => {
    return () => {
      if (viewRef.current) viewRef.current.dispose()
    }
  }, [])

  let startTime = Date.now()
  const deboundedWindowResizeHandler = useDebouncedFn(() => {
    if (Date.now() - startTime < 2000) return
    if (viewRef.current && graphViewWrap) {
      const width = graphViewWrap.current.clientWidth
      const height = graphViewWrap.current.clientHeight
      // console.log('size', width, height)
      viewRef.current.updateCanvasSize({
        width,
        height,
      })
    }
  }, 300)
  useWindowResize(deboundedWindowResizeHandler)

  return (
    <div className="graph-view">
      <div ref={graphViewWrap}></div>
    </div>
  )
}

export default GraphView
