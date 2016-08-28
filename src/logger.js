import MessageTemplate from './messageTemplate';
import LogEvent from './logEvent';
import EnrichStage from './enrichStage';
import SubPipelineStage from './subPipelineStage';
import * as logLevels from './logLevels';

const _levelMap = new WeakMap();
const _pipeline = new WeakMap();

export default class Logger {
  constructor(levelMap, pipeline) {
    _levelMap.set(this, levelMap);
    _pipeline.set(this, pipeline);
  }

  error(messageTemplate, ...properties) {
    this.write.call(this, logLevels.ERROR, messageTemplate, ...properties);
  }

  warn(messageTemplate, ...properties) {
    this.write.call(this, logLevels.WARN, messageTemplate, ...properties);
  }

  info(messageTemplate, ...properties) {
    this.write.call(this, logLevels.INFO, messageTemplate, ...properties);
  }

  debug(messageTemplate, ...properties) {
    this.write.call(this, logLevels.DEBUG, messageTemplate, ...properties);
  }

  verbose(messageTemplate, ...properties) {
    this.write.call(this, logLevels.VERBOSE, messageTemplate, ...properties);
  }

  write(level, messageTemplate, ...properties) {
    if (!_levelMap.get(this).isEnabled(level)) {
      return;
    }
    const parsedTemplate = new MessageTemplate(messageTemplate);
    const boundProperties = parsedTemplate.bindProperties(properties);

    const event = new LogEvent(new Date(), level, parsedTemplate, boundProperties);
    _pipeline.get(this).emit([event]);
  }

  enrich(properties, destructure) {
    const enrichedPipeline = new Pipeline([
      new EnrichStage(() => properties, destructure),
      new SubPipelineStage(_pipeline.get(this))
    ]);
    return new Logger(_levelMap.get(this), enrichedPipeline);
  }

  flush() {
    return _pipeline.get(this).flush();
  }

  close() {
    return _pipeline.get(this).close();
  }
}
