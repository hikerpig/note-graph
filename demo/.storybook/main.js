const path = require('path')

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-storysource',
    // '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        viewport: false,
      }
    }
  ],
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "public": path.resolve(__dirname, "../public"),
    };
    return config;
  },
}
