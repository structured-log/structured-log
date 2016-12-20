import typescript from 'rollup-plugin-typescript';

export default {
  entry: 'src/index.ts',
  dest: 'dist/structured-log.js',
  format: 'umd',
  plugins: [typescript({ target: 'es5' })],
  moduleName: 'structuredLog'
}
