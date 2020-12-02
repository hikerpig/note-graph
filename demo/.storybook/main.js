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
}
