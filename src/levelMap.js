import * as logLevels from './logLevels';

const levelMap = {
  [logLevels.ERROR]: 5,
  [logLevels.WARN]: 4,
  [logLevels.INFO]: 3,
  [logLevels.DEBUG]: 2,
  [logLevels.VERBOSE]: 1
};

class LevelMap {
  constructor(minLevel = logLevels.INFO) {
    this.minLevel = levelMap[minLevel];
  }

  isEnabled = level => mappedLevel = levelMap[level] && mappedLevel >= this.minLevel;
}

export default LevelMap;
