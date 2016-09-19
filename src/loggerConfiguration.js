import Logger from './logger';
import LevelMap from './levelMap';
import Pipeline from './pipeline';
import SinkStage from './sinkStage';
import FilterStage from './filterStage';
import EnrichStage from './enrichStage';
import WrappedSink from './wrappedSink';
import * as logLevels from './logLevels';

const _minLevelMap = new WeakMap();
const _pipelineStages = new WeakMap();

export default class LoggerConfiguration {
  constructor() {
    _minLevelMap.set(this, new LevelMap(logLevels.INFO));
    _pipelineStages.set(this, []);
  }

  toString() {
    return 'Logger';
  }

  minLevel(levelOrLevelMap) {
    const levelMap = levelOrLevelMap instanceof LevelMap ? levelOrLevelMap : new LevelMap(levelOrLevelMap);
    _pipelineStages.get(this).push(new FilterStage(logEvent => levelMap.isEnabled(logEvent.level)));
    let minLevelMap = _minLevelMap.get(this);
    if (!minLevelMap) {
      minLevelMap = new LevelMap(levelMap.minLevel);
      _minLevelMap.set(this, minLevelMap);
    }
    if (!minLevelMap.isEnabled(levelMap.minLevel)) {
      minLevelMap.minLevel = levelMap.minLevel;
    }
    levelMap.subscribe(newLevel => {
      if (!minLevelMap.isEnabled(newLevel)) {
        _minLevelMap.get(this).minLevel = newLevel;
      }
    });
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
      _minLevelMap.get(this),
      new Pipeline(_pipelineStages.get(this)));
  }
}
