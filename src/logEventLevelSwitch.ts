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
  constructor(initialLevel?: LogEventLevel) {
    this.currentLevel = initialLevel || LogEventLevel.verbose;
  }

  /**
   * Sets the minimum level for events passing through this switch to Fatal.
   */
  public fatal() {
    this.currentLevel = LogEventLevel.fatal;
  }

  /**
   * Sets the minimum level for events passing through this switch to Error.
   */
  public error() {
    this.currentLevel = LogEventLevel.error;
  }

  /**
   * Sets the minimum level for events passing through this switch to Warning.
   */
  public warning() {
    this.currentLevel = LogEventLevel.warning;
  }

  /**
   * Sets the minimum level for events passing through this switch to Information.
   */
  public information() {
    this.currentLevel = LogEventLevel.information;
  }
  
    /**
   * Sets the minimum level for events passing through this switch to Debug.
   */
  public debug() {
    this.currentLevel = LogEventLevel.debug;
  }
  
    /**
   * Sets the minimum level for events passing through this switch to Verbose.
   */
  public verbose() {
    this.currentLevel = LogEventLevel.verbose;
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
}
