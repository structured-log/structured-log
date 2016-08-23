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
    this.minLevel = levelMap[minLevel] || levelMap[logLevels.INFO];
  }

  isEnabled = level => {
    const mappedLevel = levelMap[level];
    return mappedLevel ? mappedLevel >= this.minLevel : false;
  }
}

export default LevelMap;
