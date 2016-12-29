import { ILogEvent, LogEventLevel } from './logEvent';

export interface ILogEventLevelSwitch<T> {
  fatal(): T;
  error(): T;
  warning(): T;
  information(): T;
  debug(): T;
  verbose(): T;
}

/**
 * Dynamically filters events based on a minimum log level.
 */
export class LogEventLevelSwitch implements ILogEventLevelSwitch<void> {
  private currentLevel: LogEventLevel;
  private flushCallback = () => Promise.resolve();
  constructor(initialLevel?: LogEventLevel) {
    this.currentLevel = initialLevel || LogEventLevel.verbose;
  }

  /**
   * Sets the minimum level for events passing through this switch to Fatal.
   */
  public fatal() {
    return this.setLevel(LogEventLevel.fatal);
  }

  /**
   * Sets the minimum level for events passing through this switch to Error.
   */
  public error() {
    return this.setLevel(LogEventLevel.error);
  }

  /**
   * Sets the minimum level for events passing through this switch to Warning.
   */
  public warning() {
    return this.setLevel(LogEventLevel.warning);
  }

  /**
   * Sets the minimum level for events passing through this switch to Information.
   */
  public information() {
    return this.setLevel(LogEventLevel.information);
  }
  
    /**
   * Sets the minimum level for events passing through this switch to Debug.
   */
  public debug() {
    return this.setLevel(LogEventLevel.debug);
  }
  
    /**
   * Sets the minimum level for events passing through this switch to Verbose.
   */
  public verbose() {
    return this.setLevel(LogEventLevel.verbose);
  }

  /**
   * Returns true if an event is at or below the minimum level of this switch.
   */
  public filter = (event: ILogEvent): boolean => this.isEnabled(event.level);

  /**
   * Returns true if a level is at or below the minimum level of this switch.
   */
  public isEnabled(level: LogEventLevel): boolean {
    return level <= this.currentLevel;
  }

  /**
   * Sets a callback to flush events already in the pipeline before changing the current level.
   */
  public setFlushCallback(flushCallback: () => Promise<any>) {
    this.flushCallback = flushCallback;
  }

  private setLevel(level: LogEventLevel): Promise<any> {
    return this.flushCallback().then(() => this.currentLevel = level);
  }
}
