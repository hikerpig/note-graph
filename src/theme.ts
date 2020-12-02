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
    highlightedDirection?: {
      inbound?: string
      outbound?: string
    }
  }
}

export function getColorOnContainer(container: HTMLElement, name, fallback): string {
  return getComputedStyle(container).getPropertyValue(name) || fallback
}

export function getDefaultColorOf(opts: { container?: HTMLElement } = {}): GraphViewStyle {
  const container = opts.container || document.body
  const highlightedForeground = getColorOnContainer(
    container,
    '--notegraph-highlighted-foreground-color',
    '#f9c74f'
  )
  return {
    background: getColorOnContainer(
    container,
      `--notegraph-background`,
      '#f7f7f7'
    ),
    fontSize: parseInt(
      getColorOnContainer(container, `--notegraph-font-size`, 12)
    ),
    highlightedForeground,
    node: {
      note: {
        regular: getColorOnContainer(
          container,
          '--notegraph-note-color-regular',
          '#5f76e7'
        ),
      },
      unknown: getColorOnContainer(
        container,
        '--notegraph-unkown-node-color',
        '#f94144'
      ),
    },
    link: {
      regular: getColorOnContainer(
        container,
        '--notegraph-link-color-regular',
        '#ccc'
      ),
      highlighted: getColorOnContainer(
        container,
        '--notegraph-link-color-highlighted',
        highlightedForeground
      ),
    },
    hoverNodeLink: {
      highlightedDirection: {
        inbound: '#3078cd',
        outbound: highlightedForeground,
      },
    },
  } 
}