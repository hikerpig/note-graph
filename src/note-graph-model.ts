import { NodeStyle } from './theme';
import {
  NodeId,
  GraphNode,
  GraphLink,
  GraphNodeInfo,
  GraphViewData,
  LinkId,
} from './type'

export type Note = {
  id: string
  title: string
  linkTo?: NodeId[]
  referencedBy?: NodeId[]
  /**
   * You can specify a different type (e.g. 'tag') for a note node.
   * Later you can specify different node style to it.
   */
  type?: string
  nodeStyle?: NodeStyle
}

type ModelComputedCache = {
  links: GraphLink[]
  nodeInfos: { [K in NodeId]: GraphNodeInfo }
  linkMap: Map<LinkId, GraphLink>
}

type DataSubscriber = (model: NoteGraphModel) => void

/**
 * Can generate GraphViewModel by `toGraphViewModel`
 */
export class NoteGraphModel {
  protected cache: ModelComputedCache

  protected subscribers: Array<DataSubscriber> = []

  constructor(public notes: Note[]) {
    this.notes = notes

    this.updateCache()
  }

  protected updateCache() {
    const nodes: GraphNode<{ note: Note }>[] = []
    const links: GraphLink[] = []
    const nodeInfos: { [K in NodeId]: GraphNodeInfo } = {}
    const linkMap = new Map()

    this.notes.forEach((note) => {
      nodes.push({ id: note.id, data: { note } })

      const nodeInfo: GraphNodeInfo = {
        title: note.title,
        linkIds: [],
        neighbors: [],
        nodeType: note.type || 'note',
        nodeStyle: note.nodeStyle,
      }
      if (note.linkTo) {
        note.linkTo.forEach((linkedNodeId) => {
          const link = {
            id: this.formLinkId(note.id, linkedNodeId),
            source: note.id,
            target: linkedNodeId,
          }
          links.push(link)
          linkMap.set(link.id, link)
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

    const cache: ModelComputedCache = this.cache || {} as any
    cache.nodeInfos = nodeInfos
    cache.links = links
    cache.linkMap = linkMap

    this.cache = cache as any
  }

  getNodeInfoById(id: NodeId) {
    return this.cache.nodeInfos[id]
  }

  getLinkById(id: LinkId) {
    return this.cache.linkMap.get(id)
  }

  /**
   * A link's id is a combination of source node and target node's id
   */
  formLinkId(sourceId, targetId) {
    return `${sourceId}-${targetId}`
  }

  toGraphViewData(): GraphViewData {
    const vm: GraphViewData = {
      graphData: {
        nodes: this.notes,
        links: this.cache.links,
      },
      nodeInfos: this.cache.nodeInfos,
    }
    return vm
  }

  publishChange() {
    this.subscribers.forEach((subscriber) => {
      subscriber(this)
    })
  }

  subscribe(subscriber: DataSubscriber) {
    this.subscribers.push(subscriber)
    return () => {
      const pos = this.subscribers.indexOf(subscriber)
      if (pos > -1) {
        this.subscribers.splice(pos, 1)
      }
    }
  }
}
