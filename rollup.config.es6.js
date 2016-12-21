import typescript from 'rollup-plugin-typescript';

export default {
  entry: 'src/index.ts',
  dest: 'dist/structured-log.es6.js',
  format: 'es',
  plugins: [typescript({
    target: 'es6',
    typescript: require('typescript')
  })],
  moduleName: 'structuredLog'
}
