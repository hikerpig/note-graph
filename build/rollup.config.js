import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import bundleSize from 'rollup-plugin-bundle-size'

const pkgVersion = require('../package.json').version

const banner = `/**
 * @version ${pkgVersion}
 */`

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/note-graph.js', format: 'cjs' },
    {
      file: 'dist/note-graph.umd.js',
      format: 'umd',
      name: 'NOTE_GRAPH',
      banner,
      globals: {
        'd3-color': 'd3',
        'd3-scale': 'd3',
        'd3-force': 'd3',
        'force-graph': 'ForceGraph',
      },
      plugins: [
        terser({
          format: {
            comments: function (node, comment) {
              var text = comment.value
              var type = comment.type
              if (type == 'comment2') {
                // multiline comment
                return /@version/i.test(text)
              }
            },
          },
        }),
      ],
    },
    { file: 'dist/note-graph.esm.js', format: 'es' },
  ],
  plugins: [
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: false,
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        include: ['src'],
        compilerOptions: {
          declaration: true,
          declarationDir: 'types',
        },
      },
    }),
    bundleSize(),
  ],
}
