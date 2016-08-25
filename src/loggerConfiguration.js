import Logger from './logger';
import LevelMap from './levelMap';
import Pipeline from './pipeline';
import SinkStage from './sinkStage';
import FilterStage from './filterStage';
import EnrichStage from './enrichStage';
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
    const levelMap = new LevelMap(level);
    _pipelineStages.get(this).push(new FilterStage(logEvent => levelMap.isEnabled(logEvent.level)));
    const minLevelMap = new LevelMap(_minLevel.get(this));
    if (!minLevelMap.isEnabled(level)) {
      _minLevel.set(this, level);
    }
    return this;
  }

  enrich(functionOrProperties, destructure) {
    const enrichFn = typeof functionOrProperties === 'object'
      ? () => functionOrProperties
      : functionOrProperties;
    _pipelineStages.get(this).push(new EnrichStage(enrichFn, destructure));
    return this;
  }

  filter(filterFn) {
    _pipelineStages.get(this).push(new FilterStage(filterFn));
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
