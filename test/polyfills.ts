/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />
require('es6-promise').polyfill();

interface ObjectConstructor {
  assign(target: any, ...sources: any[]): any;
}
require('../src/polyfills/objectAssign');

declare var Symbol: any;
require('es6-symbol');

declare var Proxy: any;
require('proxy-polyfill');
