import typescript from 'rollup-plugin-typescript2';

export default [{
  input: 'src/index.ts',
  output: {
    file: 'dist/structured-log.es6.js',
    format: 'es',
    name: 'structuredLog',
    sourcemap: true
  },
  plugins: [typescript({
    target: 'es6',
    typescript: require('typescript')
  })]
}, {
  input: 'src/index.ts',
  output: {
    file: 'dist/structured-log.js',
    format: 'umd',
    name: 'structuredLog',
    sourcemap: true
  },
  plugins: [typescript({
    target: 'es5',
    typescript: require('typescript')
  })]
}];
