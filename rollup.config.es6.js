import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: {
    format: 'es',
    file: 'dist/structured-log.es6.js'
  },
  plugins: [typescript({
    target: 'es6',
    typescript: require('typescript')
  })],
  name: 'structuredLog',
  sourcemap: true
}
