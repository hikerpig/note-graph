import { hsl, rgb, HSLColor, RGBColor } from 'd3-color'
import { forceX, forceY, forceCollide } from 'd3-force'
import { scaleLinear } from 'd3-scale'
import { debounce } from 'throttle-debounce'
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
import { getDefaultColorOf, GraphViewStyle } from './theme'
import { mixRgb } from './color'

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

export type GraphViewOptions = {
  container: HTMLElement
  lazyInitView?: boolean
  graphModel?: NoteGraphModel
  style?: RecursivePartial<GraphViewStyle>
  width?: number
  height?: number
  enableNodeDrag?: boolean
  enableSmartZooming?: boolean
}
    
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

  protected sizeScaler = scaleLinear()
    .domain([0, 20])
    .range([1, 5])
    .clamp(true)

  protected labelAlphaScaler = scaleLinear()
    .domain([1.2, 2])
    .range([0, 1])
    .clamp(true)

  protected currentDataModelEntry?: {
    graphModel: NoteGraphModel
    unsub: () => void
  }

  protected interactionCallbacks: Partial<
    Record<InteractionCallbackName, Array<(event) => void>>
  > = {}

  protected hasInitialZoomToFit = false

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
      this.style = getDefaultColorOf({ container: this.container })
    }
    mergeObjects<GraphViewStyle>(this.style, this.options.style)
  }

  updateStyle(style: RecursivePartial<GraphViewStyle>) {
    this.options.style = mergeObjects(this.options.style || {}, style)
    this.initStyle()

    this.refreshByStyle()
  }

  refreshByStyle() {
    if (!this.forceGraph) return

    const backgroundRgb = rgb(this.style.background)

    const getNodeColor = (nodeId, model: GraphViewModel) => {
      const info = model.nodeInfos[nodeId]
      const noteStyle = this.style.node.note
      const typeFill = this.style.node.note[info.type || 'regular'] || this.style.node.unknown
      if (this.shouldDebugColor) {
        console.log('node fill', typeFill)
      }
      switch (this.getNodeState(nodeId, model)) {
        case 'regular':
          return { fill: typeFill, border: typeFill }
        case 'lessened':
          let color: RGBColor | string = noteStyle.lessened
          if (!color) {
            const c = rgb(typeFill)
            // use mixing instead of opacity
            const mixedColor = mixRgb(c, backgroundRgb, 0.6)
            color = mixedColor
          }
          return { fill: color, border: color }
        case 'highlighted':
          return {
            fill: typeFill,
            border: this.style.highlightedForeground,
          }
        default:
          throw new Error(`Unknown type for node ${nodeId}`)
      }
    }

    this.forceGraph
      .backgroundColor(this.style.background)
      .nodeCanvasObject((node, ctx, globalScale) => {
        if (!node.id) return
        const info = this.model.nodeInfos[node.id]
        const size = this.sizeScaler(info.neighbors ? info.neighbors.length : 1)
        const { fill, border } = getNodeColor(node.id, this.model)
        const fontSize = this.style.fontSize / globalScale
        let textColor = rgb(fill)
        const nodeState = this.getNodeState(node.id, this.model)
        const alphaByDistance = this.labelAlphaScaler(globalScale)
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
        return this.getLinkColor(link as GraphLink, this.model)
      })
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

  updateCanvasSize(size: Partial<{ width: number; height: number }>) {
    if (!this.forceGraph) return
    if ('width' in size) {
      this.forceGraph.width(size.width)
    }
    if ('height' in size) {
      this.forceGraph.height(size.height)
    }
  }

  protected shouldDebugColor = false

  initView() {
    const { options, model, actions } = this
    // this runtime dependency may not be ready when this umd file excutes,
    // so we will retrieve it from the global scope
    const forceGraphFactory = ForceGraph || (window as any).ForceGraph
    const forceGraph = this.forceGraph || forceGraphFactory()

    const width =
      options.width || window.innerWidth - this.container.offsetLeft - 20
    const height =
      options.height || window.innerHeight - this.container.offsetTop - 20

    // const randomId = Math.floor(Math.random() * 1000)
    // console.log('initView', randomId)

    forceGraph(this.container)
      .height(height)
      .width(width)
      .graphData(model.graphData)
      .linkHoverPrecision(8)
      .enableNodeDrag(!!options.enableNodeDrag)
      .cooldownTime(200)
      .d3Force('x', forceX())
      .d3Force('y', forceY())
      .d3Force('collide', forceCollide(forceGraph.nodeRelSize()))
      .linkWidth(1)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth((link) =>
        this.getLinkState(link as GraphLink, model) === 'highlighted' ? 2 : 0
      )
      .onEngineStop(() => {
        if (!this.hasInitialZoomToFit) {
          this.hasInitialZoomToFit = true
          forceGraph.zoomToFit(1000, 20)
        }
      })
      .onNodeHover((node) => {
        actions.highlightNode(this.model, node ? node.id: null)
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

    if (options.enableSmartZooming !== false) {
      this.initGraphSmartZooming(forceGraph)
    }

    this.forceGraph = forceGraph

    this.refreshByStyle()
  }

  protected initGraphSmartZooming(forceGraph: ForceGraphInstance) {
    let isAdjustingZoom = false

    const debouncedZoomHandler = debounce(200, (event) => {
      if (isAdjustingZoom) return
      const { x: xb, y: yb } = this.forceGraph.getGraphBbox()
      // x/y here is translate, k is scale
      const { k, x, y } = event
      const scaledBoundL = k * xb[0]
      const scaledBoundR = k * xb[1]
      const scaledBoundT = k * yb[0]
      const scaledBoundB = k * yb[1]
      const graphCanvasW = this.forceGraph.width()
      const graphCanvasH = this.forceGraph.height()

      const oldCenter = this.forceGraph.centerAt()
      const currentCenter = oldCenter // TODO: this is more like the center before zoom, rather than current zooming one ?

      let newCenterX: number
      let newCenterY: number

      // should calculate proper center (because that's force-graph's only method...) to make the viewport fit the graphBbox
      if (scaledBoundR + x < 0) {
        // console.log('is out of right')
        isAdjustingZoom = false
        newCenterX = xb[1]
      } else if (scaledBoundL + x > graphCanvasW) {
        // console.log('is out of left')
        newCenterX = xb[0]
      }

      if (scaledBoundT + y > graphCanvasH) {
        // is out of top
        newCenterY = yb[0]
      } else if (scaledBoundB + y < 0) {
        // console.log('is out of bottom')
        newCenterY = yb[1]
      }

      if (typeof newCenterX === 'number' || typeof newCenterY === 'number') {
        // console.log('new centerX', newCenterX, newCenterY, 'old center', oldCenter)
        this.forceGraph.centerAt(newCenterX !== undefined ? newCenterX: currentCenter.x, newCenterY !== undefined ? newCenterY: currentCenter.y, 2000)
      }
    })

    forceGraph
      .onZoom((event) => {
        if (!this.hasInitialZoomToFit) return
        debouncedZoomHandler(event)
      })
      .onZoomEnd(() => {
        setTimeout(() => {
          isAdjustingZoom = false
        }, 20)
      })
  }

  protected getLinkNodeId(v: LinkObject['source']) {
    const t = typeof v
    return t === 'string' || t === 'number' ? v : (v as NodeObject).id
  }

  protected getNodeState(nodeId, model = this.model): NodeState {
    return model.selectedNodes.has(nodeId) || model.hoverNode === nodeId
      ? 'highlighted'
      : model.focusNodes.size === 0
      ? 'regular'
      : model.focusNodes.has(nodeId)
      ? 'regular'
      : 'lessened'
  }

  protected getLinkState(link, model = this.model): LinkState {
    return model.focusNodes.size === 0
      ? 'regular'
      : model.focusLinks.has(link.id)
      ? 'highlighted'
      : 'lessened'
  }

  protected getLinkColor(link: LinkObject, model: GraphViewModel) {
    const style = this.style
    const linkStyle = style.link
    switch (this.getLinkState(link, model)) {
      case 'regular':
        return linkStyle.regular
      case 'highlighted':
        // inbound/outbound link is a little bit different with hoverNode
        let linkColorByDirection: string
        const hoverNodeLinkStyle = style.hoverNodeLink
        if (model.hoverNode === this.getLinkNodeId(link.source)) {
          linkColorByDirection =
            hoverNodeLinkStyle.highlightedDirection?.outbound
        } else if (model.hoverNode === this.getLinkNodeId(link.target)) {
          linkColorByDirection =
            hoverNodeLinkStyle.highlightedDirection?.inbound
        }

        return (
          linkColorByDirection ||
          linkStyle.highlighted ||
          style.highlightedForeground
        )
      case 'lessened':
        let color: any = linkStyle.lessened
        if (!color) {
          const c = hsl(style.node.note.lessened)
          c.opacity = 0.2
          color = c
        }
        return color
      default:
        throw new Error(`Unknown type for link ${link}`)
    }
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

  /**
   * Select nodes to gain more initial attention
   */
  setSelectedNodes(nodeIds: NodeId[], isAppend = false) {
    if (!isAppend) this.model.selectedNodes.clear()

    nodeIds.forEach(nodeId => this.actions.selectNode(this.model, nodeId, true))
    this.updateViewModeInteractiveState()
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
