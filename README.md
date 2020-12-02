# Welcome to note-graph 👋

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

Note Graph is a generic visualization tool designed to show the structure of the document space and the relations between each doc.

It aims to be a handy tool for anyone who's interested in building a graph view for document spaces.

It depends on D3.js and [force-graph](https://github.com/vasturiano/force-graph), written in Typescript and can be used in the browser.

Inspired by [Foam](https://github.com/foambubble/foam).

## Demo and docs 🚀

See the [demo](http://note-graph.vercel.app/) on vercel.

## Usage

### (1) Use in html

Make sure runtime dependencies d3 and force-graph are loaded before constructing `NOTE_GRAPH.NoteGraphView`.

```html
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/d3@6.2.0/dist/d3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/force-graph@1.35.1/dist/force-graph.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/note-graph@latest/dist/note-graph.umd.js"></script>
  </head>
  <body>
    <div id="note-graph-container"></div>
    <script>
      function initGraphView() {
        const notes = [
          {
            id: '1',
            title: 'Note Graph',
            linkTo: [],
            referencedBy: [],
          },
        ]

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

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
