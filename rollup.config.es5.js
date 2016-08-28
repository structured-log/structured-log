import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/structuredLog.js',
  dest: 'dist/structured-log.js',
  plugins: [babel({
    babelrc: false,
    presets: [[ 'es2015', { modules: false } ]]
  })],
  format: 'umd',
  moduleName: 'structuredLog'
}
