import { LogEvent, LogEventLevel } from './logEvent';
import { Sink } from './sink';

const consoleProxy = {
  error: console.error || console.log || function () {},
  warn: console.warn || console.log || function () {},
  info: console.info || console.log || function () {},
  debug: console.debug || console.log || function () {},
  log: console.log || function () {}
};

export class ConsoleSink extends Sink {
  public emit(events: LogEvent[]): Promise<any> {
    if (!events) {
      const error = new Error('Argument "events" cannot be null or undefined.');
      return Promise.reject(error);
    }

    return Promise.resolve().then(() => {
      for (let i = 0; i < events.length; ++i) {
        const e = events[i];
        switch (e.level) {
          case LogEventLevel.fatal:
            consoleProxy.error('[Fatal] ' + e.messageTemplate.render());
            break;

          case LogEventLevel.error:
            consoleProxy.error('[Error] ' + e.messageTemplate.render());
            break;

          case LogEventLevel.warning:
            consoleProxy.warn('[Warning] ' + e.messageTemplate.render());
            break;
            
          case LogEventLevel.information:
            consoleProxy.info('[Information] ' + e.messageTemplate.render());
            break;
            
          case LogEventLevel.debug:
            consoleProxy.debug('[Debug] ' + e.messageTemplate.render());
            break;

          case LogEventLevel.verbose:
            consoleProxy.debug('[Verbose] ' + e.messageTemplate.render());
            break;
        }
      }
    });
  }
}
