import * as logLevels from '../logLevels';

const _options = new WeakMap();

const _console = console || {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  log: () => undefined
};

export default class ConsoleSink {
  constructor(options) {
    _options.set(this, options || {});
  }

  emit(logEvents) {
    const options = _options.get(this);
    logEvents.forEach(event => {
      const timestampPrefix = options.timestamp ? `${event.timestamp.toISOString().replace('T', ' ').replace('Z', '')} ` : '';
      const levelPrefix = event.level.slice(0, 3);
      const formattedMessage = event.messageTemplate.render(event.boundProperties);
      const fullMessage = `${timestampPrefix}[${levelPrefix}] ${formattedMessage}`;

      const args = options.complete ? [fullMessage, event.boundProperties] : [fullMessage];
      switch (event.level) {
        case logLevels.ERROR:
          _console.error.apply(_console, args);
          break;
        case logLevels.WARN:
          _console.warn.apply(_console, args);
          break;
        case logLevels.INFO:
          _console.info.apply(_console, args);
          break;
        default:
          _console.log.apply(_console, args);
          break;
      }
    });
    return Promise.resolve();
  }

  flush() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}
