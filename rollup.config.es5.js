import includePaths from 'rollup-plugin-includepaths';
import babel from 'rollup-plugin-babel';

const includePathOptions = {
  include: {},
  paths: [
    'node_modules/core-js/es6/weak-map',
    'node_modules/core-js/es6/promise',
    'node_modules/core-js/fn/array/is-array'
  ],
  external: [],
  extensions: ['.js']
};

export default {
  entry: 'src/structuredLog.js',
  dest: 'dist/structured-log.js',
  plugins: [babel({ presets: [['es2015', { 'modules': false }]] }), includePaths(includePathOptions)],
  format: 'umd',
  moduleName: 'structuredLog'
}
