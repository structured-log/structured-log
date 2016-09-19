import 'core-js/es6/weak-map';
import 'core-js/es6/promise';
import 'core-js/fn/array/find';
import 'core-js/fn/array/is-array';

import LoggerConfiguration from './loggerConfiguration';
import ConsoleSink from './sinks/consoleSink';
import * as logLevels from './logLevels';
import LevelMap from './levelMap';

class StructuredLog {
  configure() {
    return new LoggerConfiguration();
  }
}

export {
  ConsoleSink,
  logLevels,
  LevelMap
}

export default new StructuredLog();
