import * as d3 from 'd3'
import ForceGraph, { ForceGraphInstance } from 'force-graph'
import { NodeId, LinkId, GraphViewModel, GraphLink, GraphViewData } from './type'

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

type InteractionCallbackName = 'nodeClick' | 'linkClick' | 'backgroundClick'

const sizeScale = d3.scaleLinear().domain([0, 20]).range([1, 8]).clamp(true)

const labelAlpha = d3.scaleLinear().domain([1.2, 2]).range([0, 1]).clamp(true)

export type GraphViewOptions = {
  container: HTMLElement
  width?: number
  height?: number
}

type GraphViewStyle = {
  background: string
  fontSize: number
  highlightedForeground: string
  node: {
    note: {
      regular: string
      highlighted?: string
      lessened?: string
    }
    nonExistingNote: string
    unknown: string
  }
  link: {
    regular?: string
    highlighted?: string
    lessened?: string
    // inbound?: string
    // outbound?: string
  }
}

export class NoteGraphView {
  options: GraphViewOptions
  container: HTMLElement
  forceGraph: ForceGraphInstance
  model: GraphViewModel
  style: GraphViewStyle

  protected interactionCallbacks: Partial<Record<InteractionCallbackName, Array<(event) => void>>> = {}

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
  }

  initStyle() {
    this.style = {
      background: this.getColorOnContainer(`--vscode-panel-background`, '#f7f7f7'),
      fontSize: parseInt(this.getColorOnContainer(`--vscode-font-size`, 12)),
      highlightedForeground: this.getColorOnContainer(
        '--vscode-list-highlightForeground',
        '#f9c74f'
      ),
      node: {
        note: {
          regular: this.getColorOnContainer('--vscode-editor-foreground', '#277da1'),
        },
        nonExistingNote: this.getColorOnContainer(
          '--vscode-list-deemphasizedForeground',
          '#545454'
        ),
        unknown: this.getColorOnContainer('--vscode-editor-foreground', '#f94144'),
      },
      link: {
      }
    }
  }

  protected getColorOnContainer(name, fallback): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(name) ||
      fallback
    )
  }

  updateViewData(dataInput: GraphViewData) {
    Object.assign(this.model, dataInput)

    if (dataInput.focusedNode) {
      this.model.hoverNode = dataInput.focusedNode
    }
  }

  initView() {
    const { options, model, style, actions } = this
    const forceGraph = ForceGraph()

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
          const color = noteStyle.lessened || d3.hsl(typeFill).darker(3)
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

    function getLinkColor(link, model: GraphViewModel) {
      const linkStyle = style.link
      switch (getLinkState(link, model)) {
        case 'regular':
          return linkStyle.regular || d3.hsl(style.node.note.regular).darker(0.1)
        case 'highlighted':
          return linkStyle.highlighted || style.highlightedForeground
        case 'lessened':
          return linkStyle.lessened || d3.hsl(style.node.note.lessened).darker(2)
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

    function getLinkState(link: GraphLink, model: GraphViewModel): LinkState {
      return model.focusNodes.size === 0
        ? 'regular'
        : model.focusLinks.has(link.id)
        ? 'highlighted'
        : 'lessened'
    }

    const width = options.width || window.innerWidth - this.container.offsetLeft - 20
    const height = options.height || window.innerHeight - this.container.offsetTop - 20

    forceGraph(this.container)
      .height(height)
      .width(width)
      .graphData(model.graphData)
      .backgroundColor(style.background)
      .linkHoverPrecision(8)
      .cooldownTime(2000)
      .d3Force('x', d3.forceX())
      .d3Force('y', d3.forceY())
      .d3Force('collide', d3.forceCollide(forceGraph.nodeRelSize()))
      .linkWidth(1)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth((link) =>
        getLinkState(link as GraphLink, model) === 'highlighted' ? 1 : 0
      )
      .nodeCanvasObject((node, ctx, globalScale) => {
        if (!node.id) return
        const info = this.model.nodeInfos[node.id]
        const size = sizeScale(info.neighbors ? info.neighbors.length : 1)
        const { fill, border } = getNodeColor(node.id, model)
        const fontSize = style.fontSize / globalScale
        let textColor = d3.rgb(fill)
        textColor.opacity =
          getNodeState(node.id, model) === 'highlighted'
            ? 1
            : labelAlpha(globalScale)
        const label = info.title

        makeDrawWrapper(ctx)
          .circle(node.x, node.y, size + 0.5, border)
          .circle(node.x, node.y, size, fill)
          .text(label, node.x, node.y + size + 1, fontSize, textColor)
      })
      .linkColor((link) => getLinkColor(link, this.model))
      .onNodeHover((node) => {
        actions.highlightNode(this.model, node?.id)
        this.updateViewModeInteractiveState()
      })
      .onNodeClick((node, event) => {
        actions.selectNode(this.model, node.id, event.getModifierState('Shift'))
        this.updateViewModeInteractiveState()
        this.fireInteraction('nodeClick', event)
      })
      .onLinkClick((link, event) => {
        this.fireInteraction('linkClick', event)
      })
      .onBackgroundClick((event) => {
        actions.selectNode(this.model, null, event.getModifierState('Shift'))
        this.updateViewModeInteractiveState()
        this.fireInteraction('backgroundClick', event)
      })
      .onEngineStop(() => {
        forceGraph.zoomToFit(1000, 20)
      })

    this.forceGraph = forceGraph
  }

  onInteraction(name: InteractionCallbackName, cb) {
    if (!this.interactionCallbacks[name]) this.interactionCallbacks[name] = []
    const callbackList = this.interactionCallbacks[name]
    if (!callbackList.includes(cb)) {
      callbackList.push(cb)
    }

    return () => {
      const pos = callbackList.indexOf(cb)
      if (pos > -1) {
        callbackList.splice(pos, 1)
      }
    }
  }

  fireInteraction(name: InteractionCallbackName, event) {
    const callbackList = this.interactionCallbacks[name]
    if (callbackList) {
      callbackList.forEach((cb) => cb(event))
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
}
