import Logger from './logger';
import LevelMap from './levelMap';
import Pipeline from './pipeline';
import SinkStage from './sinkStage';
import WrappedSink from './wrappedSink';
import * as logLevels from './logLevels';

const _minLevel = new WeakMap();
const _pipelineStages = new WeakMap();

export default class LoggerConfiguration {
  constructor() {
    _minLevel.set(this, logLevels.INFO);
    _pipelineStages.set(this, []);
  }

  toString() {
    return 'Logger';
  }

  minLevel(level) {
    return this;
  }

  enrich(functionOrProperties) {
    return this;
  }

  writeTo(sinkOrLogger) {
    if (typeof sinkOrLogger === 'function') {
      sinkOrLogger = new WrappedSink(sinkOrLogger);
    }
    _pipelineStages.get(this).push(new SinkStage(sinkOrLogger));
    return this;
  }

  create() {
    return new Logger(
      new LevelMap(_minLevel.get(this)),
      new Pipeline(_pipelineStages.get(this)));
  }
}
