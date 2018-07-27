import { LogEventLevel, LogEvent, isEnabled } from './logEvent';
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
  console?: any;
  includeTimestamps?: boolean;
  includeProperties?: boolean;
  restrictedToMinimumLevel?: LogEventLevel;
}

export class ConsoleSink implements Sink {
  private options: ConsoleSinkOptions;
  private console: ConsoleProxy;

  constructor(options?: ConsoleSinkOptions) {
    this.options = options || {};
    const internalConsole = this.options.console || typeof console !== 'undefined' && console || null;
    const stub = function () { };

    // console.debug is no-op for Node, so use console.log instead.
    const nodeConsole = !this.options.console &&
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node;

    this.console = {
      error: (internalConsole && (internalConsole.error || internalConsole.log)) || stub,
      warn:  (internalConsole && (internalConsole.warn || internalConsole.log)) || stub,
      info:  (internalConsole && (internalConsole.info || internalConsole.log)) || stub,
      debug: (internalConsole && ((!nodeConsole && internalConsole.debug) || internalConsole.log)) || stub,
      log:   (internalConsole && internalConsole.log) || stub
    };
  }

  public emit(events: LogEvent[]) {
    for (let i = 0; i < events.length; ++i) {
      const e = events[i];
      if (!isEnabled(this.options.restrictedToMinimumLevel, e.level))
        continue;

      switch (e.level) {
        case LogEventLevel.fatal:
          this.writeToConsole(this.console.error, 'Fatal', e);
          break;

        case LogEventLevel.error:
          this.writeToConsole(this.console.error, 'Error', e);
          break;

        case LogEventLevel.warning:
          this.writeToConsole(this.console.warn, 'Warning', e);
          break;

        case LogEventLevel.information:
          this.writeToConsole(this.console.info, 'Information', e);
          break;
          
        case LogEventLevel.debug:
          this.writeToConsole(this.console.debug, 'Debug', e);
          break;
          
        case LogEventLevel.verbose:
          this.writeToConsole(this.console.debug, 'Verbose', e);
          break;

        default: 
          this.writeToConsole(this.console.log, 'Log', e);
          break;
      }
    }
  }

  public flush() {
    return Promise.resolve();
  }

  private writeToConsole(logMethod: Function, prefix: string, e: LogEvent) {
    let output = `[${prefix}] ${e.messageTemplate.render(e.properties)}`;
    if (this.options.includeTimestamps) {
      output = `${e.timestamp} ${output}`;
    }
    const values = [];
    if (this.options.includeProperties) {
      for (const key in e.properties) {
        if (e.properties.hasOwnProperty(key)) {
          values.push(e.properties[key]);
        }
      }
    }
    if (e.error instanceof Error) {
      values.push('\n', e.error);
    }
    logMethod(output, ...values);
  }
}
