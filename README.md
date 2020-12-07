# Welcome to note-graph 👋

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
[![CDN version](https://badgen.net/jsdelivr/v/npm/note-graph)](https://www.jsdelivr.com/package/npm/note-graph)

Note Graph is a generic visualization JS lib designed to show the structure of the document space and the relations between each doc.

A handy tool for anyone who is interested in building a graph view for document spaces.

It depends on D3.js and [force-graph](https://github.com/vasturiano/force-graph), written in Typescript and can be used in the browser.

[![note-graph.png](https://i.loli.net/2020/12/07/e9iKhFIvqcDOdCz.png)](https://note-graph.vercel.app/)

## 🚀 Demo and docs

See the [demo](https://note-graph.vercel.app/) on vercel.

## ✨ Features

- Display bidirectional links with an elegant yet informative way.
- Rich interaction
  - Hover on the node to see it's link flow.
  - Right click on the background to make the graph auto-fits the canvas size.
  - Smart zooming, prevent you from getting lost when panning and scrolling.
- 🎨 Highly customizable, pick your favorite colors for <del>all</del> (not yet but closing to it) the visual elements.

## 📦 Usage

### (1) Use in html

Make sure runtime dependencies d3 and force-graph are loaded before constructing `NOTE_GRAPH.NoteGraphView`.

Open [this fiddle](https://jsfiddle.net/hikerpig/3ed215um) to see how it look like.

```html
<html>
  <head>
    <title>Note Graph simple example</title>
    <script src="https://cdn.jsdelivr.net/npm/d3@6.2.0/dist/d3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/force-graph@1.35.1/dist/force-graph.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/note-graph@latest/dist/note-graph.umd.js"></script>
  </head>

  <body>
    <div id="note-graph-container"></div>
    <script>
      async function initGraphView() {
        const notes = await (
          await fetch(
            'https://note-graph.vercel.app/data/concept-data.json'
          )
        ).json()
        const graphModel = new NOTE_GRAPH.NoteGraphModel(notes)

        const graphView = new NOTE_GRAPH.NoteGraphView({
          container: document.getElementById('note-graph-container'),
          graphModel,
          enableNodeDrag: true,
        })
      }

      window.onload = function () {
        initGraphView()
      }
    </script>
  </body>
</html>
```

### (2) Use in your project that has a bundler

Install the dependency:

```sh
yarn add note-graph
```

```ts
import { NoteGraphModel, NoteGraphView } from 'note-graph'

// find some demo example code to fiddle
```

## Develop

Install dependendies:

```sh
yarn && yarn bootstrap
```

Start development:

```sh
yarn dev
```

## Author

👤 **hikerpig**

- Twitter: [@hikerpig](https://twitter.com/hikerpig)

## Acknowledgement

- Inspired by [Foam](https://github.com/foambubble/foam).

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
