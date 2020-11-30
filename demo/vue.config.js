const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.module.rules.delete('eslint');
  },
  configureWebpack: {
    resolve: {
      alias: {
        '$note-graph': path.join(__dirname, 'src/index.ts'),
      },
    },
  },
}
