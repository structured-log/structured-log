import { Pipeline } from './pipeline';
import { Logger } from './logger';
import { LogEvent, LogEventLevel, isEnabled, LogEventLevelSwitch } from './logEvent';
import { DynamicLevelSwitch, DynamicLevelSwitchStage } from './dynamicLevelSwitch';
import { FilterStage } from './filterStage';
import { Sink, SinkStage } from './sink';
import { EnrichStage, ObjectFactory } from './enrichStage';

export interface MinLevel extends LogEventLevelSwitch<LoggerConfiguration> {
  (levelOrSwitch: LogEventLevel | string | number | DynamicLevelSwitch): LoggerConfiguration;
}

/**
 * Configures pipelines for new logger instances.
 */
export class LoggerConfiguration {
  private pipeline: Pipeline;
  private _suppressErrors: boolean;

  constructor() {
    this.pipeline = new Pipeline();
    this._suppressErrors = true;
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
  minLevel: MinLevel = Object.assign((levelOrSwitch: LogEventLevel | string | number | DynamicLevelSwitch): LoggerConfiguration => {
    if (typeof levelOrSwitch === 'undefined' || levelOrSwitch === null) {
      throw new TypeError('Argument "levelOrSwitch" is not a valid LogEventLevel value or DynamicLevelSwitch instance.');
    } else if (levelOrSwitch instanceof DynamicLevelSwitch) {
      const switchStage = new DynamicLevelSwitchStage(levelOrSwitch);
      const flush = this.pipeline.flush;
      switchStage.setFlushDelegate(() => this.pipeline.flush());
      this.pipeline.addStage(switchStage);
      return this;
    } else if (typeof levelOrSwitch === 'string') {
      const level = <LogEventLevel>LogEventLevel[levelOrSwitch.toLowerCase()];
      if (typeof level === 'undefined' || level === null) {
        throw new TypeError('Argument "levelOrSwitch" is not a valid LogEventLevel value.');
      }
      return this.filter(e => isEnabled(level, e.level));
    } else {
      return this.filter(e => isEnabled(levelOrSwitch, e.level));
    }
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
      throw new TypeError('Argument "predicate" must be a function.');
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
      throw new TypeError('Argument "enricher" must be either a function or an object.');
    }

    return this;
  }

  /**
   * Enable or disable error suppression.
   */
  suppressErrors(suppress?: boolean): LoggerConfiguration {
    this._suppressErrors = typeof suppress === 'undefined' || !!suppress;
    return this;
  }

  /**
   * Creates a new logger instance based on this configuration.
   */
  create(): Logger {
    return new Logger(this.pipeline, this._suppressErrors);
  }
}
