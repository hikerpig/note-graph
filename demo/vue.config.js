const path = require('path')

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '$note-graph': path.join(__dirname, 'src/index.ts'),
      },
    },
  },
}
