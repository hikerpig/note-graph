export type NodeId = string | number

export type LinkId = NodeId

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
  type?: string
  neighbors?: NodeId[]
}

export type NoteGraphData = {
  nodes: Array<{ id: NodeId }>
  links: GraphLink[]
}

export interface GraphViewModelInput {
  graphData: NoteGraphData
  nodeInfos: {[K in NodeId]: GraphNodeInfo}
}

export interface GraphViewModel extends GraphViewModelInput {
  selectedNodes: Set<NodeId>
  /** For computing highlight */
  focusNodes: Set<NodeId>
  hoverNode: NodeId | null
  /** For computing highlight */
  focusLinks: Set<LinkId>
  adjacentMap: Map<NodeId, NodeId[]>
}
