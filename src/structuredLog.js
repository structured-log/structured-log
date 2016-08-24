import 'core-js/es6/weak-map';
import 'core-js/es6/promise';
import 'core-js/fn/array/is-array';

import LoggerConfiguration from './loggerConfiguration';
import ConsoleSink from './sinks/consoleSink';

class StructuredLog {
  configure() {
    return new LoggerConfiguration();
  }
}

export {
  ConsoleSink
}

export default new StructuredLog();
