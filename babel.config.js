module.exports = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-env', {
      "targets": {
        "chrome": "58"
      }
    }]
  ]
}
