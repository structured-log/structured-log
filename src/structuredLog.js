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
