import { LogEventLevel, LogEvent } from './logEvent';
import { Sink } from './sink';
import { MessageTemplate } from './messageTemplate';

export interface ConsoleProxy {
  error(message?: any, ...properties: any[]);
  warn(message?: any, ...properties: any[]);
  info(message?: any, ...properties: any[]);
  debug(message?: any, ...properties: any[]);
  log(message?: any, ...properties: any[]);
}

export interface ConsoleSinkOptions {
  consoleProxy?: any;
  includeTimestamps?: boolean;
  includeProperties?: boolean;
}

export class ConsoleSink implements Sink {
  private options: ConsoleSinkOptions;
  private consoleProxy: ConsoleProxy;

  constructor(options?: ConsoleSinkOptions) {
    this.options = options || {};
    const internalConsole = this.options.consoleProxy || typeof console !== 'undefined' && console || null;
    const stub = function () { };
    this.consoleProxy = {
      error: (internalConsole && (internalConsole.error || internalConsole.log)) || stub,
      warn:  (internalConsole && (internalConsole.warn || internalConsole.log)) || stub,
      info:  (internalConsole && (internalConsole.info || internalConsole.log)) || stub,
      debug: (internalConsole && (internalConsole.debug || internalConsole.log)) || stub,
      log:   (internalConsole && internalConsole.log) || stub
    };
  }

  public emit(events: LogEvent[]) {
    for (let i = 0; i < events.length; ++i) {
      const e = events[i];
      switch (e.level) {
        case LogEventLevel.fatal:
          this.writeToConsole(this.consoleProxy.error, 'Fatal', e);
          break;

        case LogEventLevel.error:
          this.writeToConsole(this.consoleProxy.error, 'Error', e);
          break;

        case LogEventLevel.warning:
          this.writeToConsole(this.consoleProxy.warn, 'Warning', e);
          break;
          
        case LogEventLevel.debug:
          this.writeToConsole(this.consoleProxy.debug, 'Debug', e);
          break;
          
        case LogEventLevel.verbose:
          this.writeToConsole(this.consoleProxy.debug, 'Verbose', e);
          break;

        case LogEventLevel.information:
        default: 
          this.writeToConsole(this.consoleProxy.info, 'Information', e);
          break;
      }
    }
  }

  public flush() {
    return Promise.resolve();
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
