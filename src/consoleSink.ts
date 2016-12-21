import { LogEvent, LogEventLevel } from './logEvent';
import { Sink } from './sink';
import MessageTemplate from './messageTemplate';

const consoleProxy = {
  error: (typeof console !== 'undefined' && console && (console.error || console.log)) || function () {},
  warn:  (typeof console !== 'undefined' && console && (console.warn || console.log)) || function () {},
  info:  (typeof console !== 'undefined' && console && (console.info || console.log)) || function () {},
  debug: (typeof console !== 'undefined' && console && (console.debug || console.log)) || function () {},
  log:   (typeof console !== 'undefined' && console && console.log) || function () {}
};

export interface ConsoleSinkOptions {
  includeTimestamps?: boolean;
  includeProperties?: boolean;
}

export class ConsoleSink extends Sink {
  private options: ConsoleSinkOptions;

  constructor(options?: ConsoleSinkOptions) {
    super();
    this.options = options || {};
  }

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
            this.writeToConsole(consoleProxy.error, 'Fatal', e);
            break;

          case LogEventLevel.error:
            this.writeToConsole(consoleProxy.error, 'Error', e);
            break;

          case LogEventLevel.warning:
            this.writeToConsole(consoleProxy.warn, 'Warning', e);
            break;

          case LogEventLevel.information:
            this.writeToConsole(consoleProxy.info, 'Information', e);
            break;
            
          case LogEventLevel.debug:
            this.writeToConsole(consoleProxy.debug, 'Debug', e);
            break;
            
          case LogEventLevel.verbose:
            this.writeToConsole(consoleProxy.debug, 'Verbose', e);
            break;
        }
      }
    });
  }

  private writeToConsole(logMethod: Function, prefix: string, e: LogEvent) {
    let output = '[' + prefix + '] ' + e.messageTemplate.render(e.properties);
    if (this.options.includeTimestamps) {
      output = e.timestamp + ' ' + output;
    }
    const values = [];
    if (this.options.includeProperties) {
      for (const key in e.properties) {
        if (e.properties.hasOwnProperty(key)) {
          values.push(e.properties[key]);
        }
      }
    }
    logMethod(output, ...values);
  }
}
