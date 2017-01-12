import { LogEventLevel, LogEventLevelSwitch, isEnabled } from './logEvent';
import { FilterStage } from './filterStage';

/**
 * Allows dynamic control of the logging level.
 */
export class DynamicLevelSwitch implements LogEventLevelSwitch<Promise<any>> {
  private minLevel: LogEventLevel = null;

  /**
   * Gets or sets a delegate that can be called when the pipeline needs to be flushed.
   * This should generally not be modified, as it will be provided by the pipeline stage.
   */
  flushDelegate: () => Promise<any> = () => Promise.resolve();

  fatal() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.fatal);
  }

  error() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.error);
  }

  warning() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.warning);
  }

  information() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.information);
  }

  debug() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.debug);
  }

  verbose() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.verbose);
  }

  off() {
    return this.flushDelegate().then(() => this.minLevel = LogEventLevel.off);
  }

  isEnabled(level: LogEventLevel) {
    return this.minLevel === null || isEnabled(this.minLevel, level);
  }
}

export class DynamicLevelSwitchStage extends FilterStage {
  private dynamicLevelSwitch: DynamicLevelSwitch;

  /**
   * Sets a delegate that can be called when the pipeline needs to be flushed.
   */
  setFlushDelegate(flushDelegate: () => Promise<any>) {
    this.dynamicLevelSwitch.flushDelegate = flushDelegate;
  }

  constructor(dynamicLevelSwitch: DynamicLevelSwitch) {
    super(e => dynamicLevelSwitch.isEnabled(e.level));
    this.dynamicLevelSwitch = dynamicLevelSwitch;
  }
}
