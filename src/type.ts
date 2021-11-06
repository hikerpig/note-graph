import { NodeStyle } from "./theme"

export type NodeId = string | number

export type LinkId = string | number

export type GraphNode<D> = {
  id: NodeId
  data: D
}

export type GraphLink = {
  id?: LinkId
  source: NodeId
  target: NodeId
}

export type GraphNodeInfo = {
  title: string
  linkIds?: LinkId[]
  colorType?: string
  nodeType: string
  neighbors?: NodeId[]
  nodeStyle?: NodeStyle
}

export type NoteGraphData = {
  nodes: Array<{ id: NodeId }>
  links: GraphLink[]
}

/**
 * Part of the GraphViewModel that can be provided as data input
 */
export interface GraphViewData {
  /** data for d3 ForceGraph */
  graphData: NoteGraphData
  nodeInfos: {[K in NodeId]: GraphNodeInfo}
  focusedNode?: NodeId | null
}

/**
 * states of the NoteGraphView
 */
export interface GraphViewModel extends GraphViewData {
  selectedNodes: Set<NodeId>
  /** For computing highlight */
  focusNodes: Set<NodeId>
  hoverNode: NodeId | null
  /** For computing highlight */
  focusLinks: Set<LinkId>
}
