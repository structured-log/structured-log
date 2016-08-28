import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/structuredLog.js',
  dest: 'dist/structured-log.es6.js',
  format: 'es',
  exports: 'named'
}
