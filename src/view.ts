import * as d3 from 'd3'
import ForceGraph, { ForceGraphInstance } from 'force-graph'
import { NodeId, LinkId, GraphViewModel, GraphLink } from './type'

type LinkState = 'regular' | 'lessened' | 'highlighted'

type NodeState = 'regular' | 'lessened' | 'highlighted'

interface GraphModelActions {
  selectNode(
    model: GraphViewModel,
    id: NodeId | null | undefined,
    isAppend?: boolean
  ): void
  highlightNode(model: GraphViewModel, id: NodeId | undefined): void
}

function getStyle(name, fallback) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name) ||
    fallback
  )
}

const sizeScale = d3.scaleLinear().domain([0, 30]).range([1, 3]).clamp(true)

const labelAlpha = d3.scaleLinear().domain([1.2, 2]).range([0, 1]).clamp(true)

type GraphViewOptions = {
  container: HTMLElement
}

export class NoteGraphView {
  container: HTMLElement
  forceGraph: ForceGraphInstance
  model: GraphViewModel
  style = {
    background: getStyle(`--vscode-panel-background`, '#202020'),
    fontSize: parseInt(getStyle(`--vscode-font-size`, 12)),
    highlightedForeground: getStyle(
      '--vscode-list-highlightForeground',
      '#f9c74f'
    ),
    node: {
      note: getStyle('--vscode-editor-foreground', '#277da1'),
      nonExistingNote: getStyle(
        '--vscode-list-deemphasizedForeground',
        '#545454'
      ),
      unknown: getStyle('--vscode-editor-foreground', '#f94144'),
    },
  }

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
      adjacentMap: new Map(),
    }
  }

  updateViewModel(partialModel: Pick<GraphViewModel, 'graphData' | 'nodeInfos'>) {
    Object.assign(this.model, partialModel)

    const adjacentMap = new Map<NodeId, NodeId[]>()
    partialModel.graphData.links.forEach((link) => {
      const targetNodeIds = adjacentMap.get(link.source) || []
      targetNodeIds.push(link.target)
    })

    this.model.adjacentMap = adjacentMap
  }

  initView() {
    const forceGraph = ForceGraph()
    const { model, style, actions } = this

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
      const typeFill = style.node[info.type || 'unknown']
      switch (getNodeState(nodeId, model)) {
        case 'regular':
          return { fill: typeFill, border: typeFill }
        case 'lessened':
          const darker = d3.hsl(typeFill).darker(3)
          return { fill: darker, border: darker }
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
      switch (getLinkState(link, model)) {
        case 'regular':
          return d3.hsl(style.node.note).darker(2)
        case 'highlighted':
          return style.highlightedForeground
        case 'lessened':
          return d3.hsl(style.node.note).darker(4)
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

    forceGraph(this.container)
      .graphData(model.graphData)
      .backgroundColor(style.background)
      .linkHoverPrecision(8)
      .d3Force('x', d3.forceX())
      .d3Force('y', d3.forceY())
      .d3Force('collide', d3.forceCollide(forceGraph.nodeRelSize()))
      .linkWidth(0.5)
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
        this.updateView()
      })
      .onNodeClick((node, event) => {
        actions.selectNode(this.model, node.id, event.getModifierState('Shift'))
        this.updateView()
      })
      .onBackgroundClick((event) => {
        actions.selectNode(this.model, null, event.getModifierState('Shift'))
        this.updateView()
      })
  }

  updateView() {
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
