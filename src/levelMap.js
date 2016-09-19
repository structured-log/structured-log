import * as logLevels from './logLevels';

const levelMap = {
  [logLevels.ERROR]: 5,
  [logLevels.WARN]: 4,
  [logLevels.INFO]: 3,
  [logLevels.DEBUG]: 2,
  [logLevels.VERBOSE]: 1
};

const _minLevel = new WeakMap();
const _subscribers = new WeakMap();

export default class LevelMap {
  constructor(minLevel = logLevels.INFO) {
    _subscribers.set(this, []);
    this.minLevel = minLevel;
  }

  isEnabled(level) {
    const mappedLevel = levelMap[level];
    return mappedLevel ? mappedLevel >= this.minLevel : false;
  }

  get minLevel() {
    return _minLevel.get(this);
  }

  set minLevel(level) {
    const newMinLevel = levelMap[level] || levelMap[logLevels.INFO];
    _minLevel.set(this, newMinLevel);
    const newMinLevelKey = Object.keys(levelMap).find(k => levelMap[k] === newMinLevel);
    _subscribers.get(this).forEach(s => s(newMinLevelKey));
  }

  subscribe(fn) {
    const subscribers = _subscribers.get(this);
    if (~subscribers.indexOf(fn)) {
      return;
    }
    subscribers.push(fn);
  }

  unsubscribe(fn) {
    const subscribers = _subscribers.get(this);
    const subscription = subscribers.indexOf(fn);
    if (~subscription) {
      subscribers.splice(subscription, 1);
    }
  }
}
