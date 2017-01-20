/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />

import { Sink } from '../src/sink';
import { PipelineStage } from '../src/pipeline';
import { ConsoleProxy } from '../src/consoleSink';

export class ConcreteSink implements Sink {
  emit(events) { }
  flush(): Promise<any> { return Promise.resolve(); }
}

export class ConcretePipelineStage implements PipelineStage {
  emit(events) { return events; }
  flush(): Promise<any> { return Promise.resolve(); }
}

export class ConcreteConsoleProxy implements ConsoleProxy {
  error(message?: any, ...properties: any[]) { }
  warn(message?: any, ...properties: any[]) { }
  info(message?: any, ...properties: any[]) { }
  debug(message?: any, ...properties: any[]) { }
  log(message?: any, ...properties: any[]) { }
}
