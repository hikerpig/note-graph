import * as d3 from 'd3'
import ForceGraph, {
  ForceGraphInstance,
  LinkObject,
  NodeObject,
} from 'force-graph'
import {
  NodeId,
  LinkId,
  GraphViewModel,
  GraphLink,
  GraphViewData,
} from './type'
import { NoteGraphModel } from './note-graph-model'
import { RecursivePartial, mergeObjects } from './util'

export type LinkState = 'regular' | 'lessened' | 'highlighted'

export type NodeState = 'regular' | 'lessened' | 'highlighted'

interface GraphModelActions {
  selectNode(
    model: GraphViewModel,
    id: NodeId | null | undefined,
    isAppend?: boolean
  ): void
  highlightNode(model: GraphViewModel, id: NodeId | undefined): void
}

type InteractionCallbackName =
  | 'nodeClick'
  | 'linkClick'
  | 'backgroundClick'
  | 'backgroundRightClick'

const sizeScaler = d3.scaleLinear().domain([0, 20]).range([1, 4]).clamp(true)

const labelAlphaScaler = d3
  .scaleLinear()
  .domain([1.2, 2])
  .range([0, 1])
  .clamp(true)

export type GraphViewOptions = {
  container: HTMLElement
  lazyInitView?: boolean
  graphModel?: NoteGraphModel
  style?: RecursivePartial<GraphViewStyle>
  width?: number
  height?: number
  enableForDrag?: boolean
}

export type GraphViewStyle = {
  /** canvas background */
  background: string
  fontSize: number
  /** node highlighted border corlor */
  highlightedForeground: string
  node: {
    note: {
      regular: string
      highlighted?: string
      lessened?: string
    }
    unknown: string
  }
  link: {
    regular?: string
    highlighted?: string
    lessened?: string
  }
  hoverNodeLink: {
    highlightedWithDirection?: {
      inbound?: string
      outbound?: string
    }
  }
}

/**
 * The view of the graph.
 * Wraps a d3 force-graph inside
 */
export class NoteGraphView {
  options: GraphViewOptions
  container: HTMLElement
  forceGraph: ForceGraphInstance
  model: GraphViewModel
  style: GraphViewStyle

  protected currentDataModelEntry?: {
    graphModel: NoteGraphModel
    unsub: () => void
  }

  protected interactionCallbacks: Partial<
    Record<InteractionCallbackName, Array<(event) => void>>
  > = {}

  actions: GraphModelActions = {
    selectNode(model: GraphViewModel, nodeId: NodeId | undefined, isAppend) {
      if (!isAppend) {
        model.selectedNodes.clear()
      }
      if (nodeId != null) {
        model.selectedNodes.add(nodeId)
      }
    },
    highlightNode(model: GraphViewModel, nodeId: NodeId) {
      model.hoverNode = nodeId
    },
  }

  constructor(opts: GraphViewOptions) {
    this.options = opts
    this.container = opts.container

    this.model = {
      graphData: {
        nodes: [],
        links: [],
      },
      nodeInfos: {},
      selectedNodes: new Set(),
      focusNodes: new Set(),
      focusLinks: new Set(),
      hoverNode: null,
    }

    this.initStyle()

    if (opts.graphModel) {
      this.linkWithGraphModel(opts.graphModel)
      if (!opts.lazyInitView) {
        this.initView()
      }
    }
  }

  protected initStyle() {
    if (!this.style) {
      const highlightedForeground = this.getColorOnContainer(
        '--notegraph-highlighted-foreground-color',
        '#f9c74f'
      )
      this.style = {
        background: this.getColorOnContainer(
          `--notegraph-background`,
          '#f7f7f7'
        ),
        fontSize: parseInt(
          this.getColorOnContainer(`--notegraph-font-size`, 12)
        ),
        highlightedForeground,
        node: {
          note: {
            regular: this.getColorOnContainer(
              '--notegraph-note-color-regular',
              '#277da1'
            ),
          },
          unknown: this.getColorOnContainer(
            '--notegraph-unkown-node-color',
            '#f94144'
          ),
        },
        link: {
          regular: this.getColorOnContainer(
            '--notegraph-link-color-regular',
            '#ccc'
          ),
          highlighted: this.getColorOnContainer(
            '--notegraph-link-color-highlighted',
            highlightedForeground
          ),
        },
        hoverNodeLink: {
          highlightedWithDirection: {
            inbound: '#3078cd',
          },
        },
      }
    }
    mergeObjects<GraphViewStyle>(this.style, this.options.style)
  }

  updateStyle(style: RecursivePartial<GraphViewStyle>) {
    this.options.style = mergeObjects(this.options.style || {}, style)
    this.initStyle()

    if (this.forceGraph) {
      this.forceGraph.backgroundColor(this.style.background)
    }
  }

  linkWithGraphModel(graphModel: NoteGraphModel) {
    if (this.currentDataModelEntry) {
      this.currentDataModelEntry.unsub()
    }

    this.updateViewData(graphModel.toGraphViewData())

    const unsub = graphModel.subscribe(() => {
      this.updateViewData(graphModel.toGraphViewData())
    })
    this.currentDataModelEntry = {
      graphModel,
      unsub,
    }
  }

  protected getColorOnContainer(name, fallback): string {
    return getComputedStyle(this.container).getPropertyValue(name) || fallback
  }

  updateViewData(dataInput: GraphViewData) {
    Object.assign(this.model, dataInput)

    if (dataInput.focusedNode) {
      this.model.hoverNode = dataInput.focusedNode
    }
  }

  updateCanvasSize(size: Partial<{ width: number, height: number }>) {
    if (!this.forceGraph) return
    if ('width' in size) {
      this.forceGraph.width(size.width)
    }
    if ('height' in size) {
      this.forceGraph.height(size.height)
    }
  }

  initView() {
    const { options, model, style, actions } = this
    const forceGraph = this.forceGraph || ForceGraph()

    const makeDrawWrapper = (ctx) => ({
      circle: function (x, y, radius, color) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        ctx.fillStyle = color
        ctx.fill()
        ctx.closePath()
        return this
      },
      text: function (text, x, y, size, color) {
        ctx.font = `${size}px Sans-Serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = color
        ctx.fillText(text, x, y)
        return this
      },
    })

    function getNodeColor(nodeId, model: GraphViewModel) {
      const info = model.nodeInfos[nodeId]
      const noteStyle = style.node.note
      const typeFill = style.node[info.type || 'unknown']
      switch (getNodeState(nodeId, model)) {
        case 'regular':
          return { fill: typeFill, border: typeFill }
        case 'lessened':
          let color = noteStyle.lessened
          if (!color) {
            const c = d3.hsl(typeFill)
            c.opacity = 0.2
            color = c
          }
          return { fill: color, border: color }
        case 'highlighted':
          return {
            fill: typeFill,
            border: style.highlightedForeground,
          }
        default:
          throw new Error(`Unknown type for node ${nodeId}`)
      }
    }

    function getLinkNodeId(v: LinkObject['source']) {
      const t = typeof v
      return t === 'string' || t === 'number' ? v : (v as NodeObject).id
    }

    function getLinkColor(link: LinkObject, model: GraphViewModel) {
      const linkStyle = style.link
      switch (getLinkState(link, model)) {
        case 'regular':
          return linkStyle.regular
        case 'highlighted':
          // inbound/outbound link is a little bit different with hoverNode
          let linkColorByDirection: string
          const hoverNodeLinkStyle = style.hoverNodeLink
          if (model.hoverNode === getLinkNodeId(link.source)) {
            linkColorByDirection =
              hoverNodeLinkStyle.highlightedWithDirection?.outbound
          } else if (model.hoverNode === getLinkNodeId(link.target)) {
            linkColorByDirection =
              hoverNodeLinkStyle.highlightedWithDirection?.inbound
          }

          return (
            linkColorByDirection ||
            linkStyle.highlighted ||
            style.highlightedForeground
          )
        case 'lessened':
          let color = linkStyle.lessened
          if (!color) {
            const c = d3.hsl(style.node.note.lessened)
            c.opacity = 0.2
            color = c
          }
          return color
        default:
          throw new Error(`Unknown type for link ${link}`)
      }
    }

    function getNodeState(nodeId, model: GraphViewModel): NodeState {
      return model.selectedNodes.has(nodeId) || model.hoverNode === nodeId
        ? 'highlighted'
        : model.focusNodes.size === 0
        ? 'regular'
        : model.focusNodes.has(nodeId)
        ? 'regular'
        : 'lessened'
    }

    function getLinkState(link, model: GraphViewModel): LinkState {
      return model.focusNodes.size === 0
        ? 'regular'
        : model.focusLinks.has(link.id)
        ? 'highlighted'
        : 'lessened'
    }

    const width =
      options.width || window.innerWidth - this.container.offsetLeft - 20
    const height =
      options.height || window.innerHeight - this.container.offsetTop - 20

    let hasInitialZoomToFit = false

    // const randomId = Math.floor(Math.random() * 1000)
    // console.log('initView', randomId)

    forceGraph(this.container)
      .height(height)
      .width(width)
      .graphData(model.graphData)
      .backgroundColor(style.background)
      .linkHoverPrecision(8)
      .enableNodeDrag(!!options.enableForDrag)
      .cooldownTime(200)
      .d3Force('x', d3.forceX())
      .d3Force('y', d3.forceY())
      .d3Force('collide', d3.forceCollide(forceGraph.nodeRelSize()))
      .linkWidth(1)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth((link) =>
        getLinkState(link as GraphLink, model) === 'highlighted' ? 2 : 0
      )
      .nodeCanvasObject((node, ctx, globalScale) => {
        if (!node.id) return
        const info = this.model.nodeInfos[node.id]
        const size = sizeScaler(info.neighbors ? info.neighbors.length : 1)
        const { fill, border } = getNodeColor(node.id, model)
        const fontSize = style.fontSize / globalScale
        let textColor = d3.rgb(fill)
        const nodeState = getNodeState(node.id, model)
        const alphaByDistance = labelAlphaScaler(globalScale)
        textColor.opacity =
          nodeState === 'highlighted'
            ? 1
            : nodeState === 'lessened'
            ? Math.min(0.2, alphaByDistance)
            : alphaByDistance

        const label = info.title

        makeDrawWrapper(ctx)
          .circle(node.x, node.y, size + 0.5, border)
          .circle(node.x, node.y, size, fill)
          .text(label, node.x, node.y + size + 1, fontSize, textColor)
      })
      .linkColor((link) => {
        return getLinkColor(link as GraphLink, this.model)
      })
      .onEngineStop(() => {
        if (!hasInitialZoomToFit) {
          hasInitialZoomToFit = true
          forceGraph.zoomToFit(1000, 20)
        }
      })
      .onNodeHover((node) => {
        actions.highlightNode(this.model, node?.id)
        this.updateViewModeInteractiveState()
      })
      .onNodeClick((node, event) => {
        actions.selectNode(this.model, node.id, event.getModifierState('Shift'))
        this.updateViewModeInteractiveState()
        this.fireInteraction('nodeClick', { node, event })
      })
      .onLinkClick((link, event) => {
        this.fireInteraction('linkClick', { link, event })
      })
      .onBackgroundClick((event) => {
        actions.selectNode(this.model, null, event.getModifierState('Shift'))
        this.updateViewModeInteractiveState()
        this.fireInteraction('backgroundClick', { event })
      })
      .onBackgroundRightClick((event) => {
        forceGraph.zoomToFit(1000, 20)
        this.fireInteraction('backgroundRightClick', { event })
      })

    this.forceGraph = forceGraph
  }

  protected updateViewModeInteractiveState() {
    const { model } = this
    // compute highlighted elements
    const focusNodes = new Set<NodeId>()
    const focusLinks = new Set<LinkId>()
    if (model.hoverNode) {
      focusNodes.add(model.hoverNode)
      const info = model.nodeInfos[model.hoverNode]
      info.neighbors?.forEach((neighborId) => focusNodes.add(neighborId))
      info.linkIds?.forEach((link) => focusLinks.add(link))
    }
    if (model.selectedNodes) {
      model.selectedNodes.forEach((nodeId) => {
        focusNodes.add(nodeId)
        const info = model.nodeInfos[nodeId]
        info.neighbors?.forEach((neighborId) => focusNodes.add(neighborId))
        info.linkIds?.forEach((link) => focusLinks.add(link))
      })
    }
    model.focusNodes = focusNodes
    model.focusLinks = focusLinks
  }

  onInteraction(name: InteractionCallbackName, cb) {
    if (!this.interactionCallbacks[name]) this.interactionCallbacks[name] = []
    const callbackList = this.interactionCallbacks[name]
    callbackList.push(cb)

    return () => {
      const pos = callbackList.indexOf(cb)
      if (pos > -1) {
        callbackList.splice(pos, 1)
      }
    }
  }

  fireInteraction(name: InteractionCallbackName, payload) {
    const callbackList = this.interactionCallbacks[name]
    if (callbackList) {
      callbackList.forEach((cb) => cb(payload))
    }
  }

  dispose() {
    if (this.forceGraph) {
      this.forceGraph.pauseAnimation()
    }
  }
}
