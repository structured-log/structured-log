import * as logLevels from './logLevels';


class Logger {
  constructor(levelMap, pipeline) {
    this.levelMap = levelMap;
    this.pipeline = pipeline;
  }

  error = (messageTemplate, ...properties) => {
    this.write.call(this, logLevels.ERROR, messageTemplate, ...properties);
  }

  warn = (messageTemplate, ...properties) => {
    this.write.call(this, logLevels.WARN, messageTemplate, ...properties);
  }

  info = (messageTemplate, ...properties) => {
    this.write.call(this, logLevels.INFO, messageTemplate, ...properties);
  }

  debug = (messageTemplate, ...properties) => {
    this.write.call(this, logLevels.DEBUG, messageTemplate, ...properties);
  }

  verbose = (messageTemplate, ...properties) => {
    this.write.call(this, logLevels.VERBOSE, messageTemplate, ...properties);
  }

  write = (level, messageTemplate, ...properties) => {
    // Do stuff
  }

  enrich = (properties, destructure) => {
    const enrichedPipeline = new Pipeline([
      // Set stuff
    ]);
    return new Logger(this.levelMap, enrichedPipeline);
  }

  flush = done => this.pipeline.flush(done)

  close = done => this.pipeline.close(done)
}

export default Logger;
