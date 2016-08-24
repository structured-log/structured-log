import * as logLevels from './logLevels';

const levelMap = {
  [logLevels.ERROR]: 5,
  [logLevels.WARN]: 4,
  [logLevels.INFO]: 3,
  [logLevels.DEBUG]: 2,
  [logLevels.VERBOSE]: 1
};

const _minLevel = new WeakMap();

export default class LevelMap {
  constructor(minLevel = logLevels.INFO) {
    _minLevel.set(this, levelMap[minLevel] || levelMap[logLevels.INFO]);
  }

  isEnabled(level) {
    const mappedLevel = levelMap[level];
    return mappedLevel ? mappedLevel >= _minLevel.get(this) : false;
  }
}
