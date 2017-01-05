import { Pipeline } from './pipeline';
import { Logger } from './logger';
import { LogEvent, LogEventLevel, isEnabled } from './logEvent';
import { FilterStage } from './filterStage';
import { Sink, SinkStage } from './sink';
import { EnrichStage, ObjectFactory } from './enrichStage';

export interface LogEventLevelSwitch<T> {
  (level: LogEventLevel): T;
  fatal(): T;
  error(): T;
  warning(): T;
  information(): T;
  debug(): T;
  verbose(): T;
}

export class LoggerConfiguration {
  private pipeline: Pipeline;

  constructor() {
    this.pipeline = new Pipeline();
  }

  /**
   * Adds a sink to the pipeline.
   * @param {Sink} sink The sink to add.
   */
  writeTo(sink: Sink): LoggerConfiguration {
    this.pipeline.addStage(new SinkStage(sink));
    return this;
  }

  /**
   * Sets the minimum level for any subsequent stages in the pipeline.
   */
  minLevel: LogEventLevelSwitch<LoggerConfiguration> = Object.assign((level: LogEventLevel): LoggerConfiguration => {
    return this.filter(e => isEnabled(level, e.level));
  }, {
    fatal: () =>        this.minLevel(LogEventLevel.fatal),
    error: () =>        this.minLevel(LogEventLevel.error),
    warning: () =>      this.minLevel(LogEventLevel.warning),
    information: () =>  this.minLevel(LogEventLevel.information),
    debug: () =>        this.minLevel(LogEventLevel.debug),
    verbose: () =>      this.minLevel(LogEventLevel.verbose)
  });

  /**
   * Adds a filter to the pipeline.
   * @param {(e: LogEvent) => boolean} predicate Filter predicate to use.
   */
  filter(predicate: (e: LogEvent) => boolean): LoggerConfiguration {
    if (predicate instanceof Function) {
      this.pipeline.addStage(new FilterStage(predicate));
    } else {
      throw new Error('Argument "predicate" must be a function.');
    }
    return this;
  }

  /**
   * Adds an enricher to the pipeline.
   */
  enrich(enricher: Object | ObjectFactory): LoggerConfiguration {
    if (enricher instanceof Function || enricher instanceof Object) {
      this.pipeline.addStage(new EnrichStage(enricher));
    } else {
      throw new Error('Argument "enricher" must be either a function or an object.');
    }

    return this;
  }

  /**
   * Creates a new logger instance based on this configuration.
   */
  create(): Logger {
    return new Logger(this.pipeline);
  }
}
