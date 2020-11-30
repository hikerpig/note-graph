import * as path from 'path' 

export default {
  root: 'demo',
  enableEsbuild: false,
  alias: {
    '$note-graph': path.join(__dirname, 'src/index.ts'),
    'demo/': path.join(__dirname, 'demo'),
  }
}
