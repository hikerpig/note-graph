module.exports = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-env', {
      "targets": {
        "chrome": "58",
        "node": "12"
      }
    }]
  ]
}
