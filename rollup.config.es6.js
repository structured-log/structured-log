import typescript from 'rollup-plugin-typescript2';

export default {
  entry: 'src/index.ts',
  dest: 'dist/structured-log.es6.js',
  format: 'es',
  plugins: [typescript({
    target: 'es6',
    typescript: require('typescript')
  })],
  moduleName: 'structuredLog',
  sourceMap: true
}
