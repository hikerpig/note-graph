import {
  NodeId,
  GraphNode,
  GraphLink,
  GraphNodeInfo,
  GraphViewData,
} from './type'

export type Note = {
  id: string
  title: string
  linkTo?: NodeId[]
  referencedBy?: NodeId[]
}

/**
 * Can generate GraphViewModel by `toGraphViewModel`
 */
export class NoteGraphModel {
  constructor(public notes: Note[]) {}

  /**
   * A link's id is a combination of source node and target node's id
   */
  formLinkId(sourceId, targetId) {
    return `${sourceId}-${targetId}`
  }

  toGraphViewData(): GraphViewData {
    const nodes: GraphNode<{ note: Note }>[] = []
    const links: GraphLink[] = []
    const nodeInfos: { [K in NodeId]: GraphNodeInfo } = {}

    this.notes.forEach((note) => {
      nodes.push({ id: note.id, data: { note } })

      const nodeInfo: GraphNodeInfo = {
        title: note.title,
        linkIds: [],
        neighbors: [],
      }
      if (note.linkTo) {
        note.linkTo.forEach((linkedNodeId) => {
          const link = {
            id: this.formLinkId(note.id, linkedNodeId),
            source: note.id,
            target: linkedNodeId,
          }
          links.push(link)
          nodeInfo.linkIds.push(link.id)
          nodeInfo.neighbors.push(linkedNodeId)
        })
      }
      if (note.referencedBy) {
        note.referencedBy.forEach((refererId) => {
          nodeInfo.linkIds.push(this.formLinkId(refererId, note.id))
          nodeInfo.neighbors.push(refererId)
        })
      }

      nodeInfos[note.id] = nodeInfo
    })

    const vm: GraphViewData = {
      graphData: {
        nodes: this.notes,
        links,
      },
      nodeInfos,
    }
    return vm
  }
}
