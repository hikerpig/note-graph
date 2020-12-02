import { addons } from '@storybook/addons';
import { themes } from '@storybook/theming';
import customTheme from './customTheme'

addons.setConfig({
  theme: customTheme,
  // theme: themes.dark,
  // showPanel: false,
  panelPosition: 'right',
  selectedPanel: 'docs',
});