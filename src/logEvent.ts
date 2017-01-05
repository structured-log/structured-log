import { MessageTemplate } from './messageTemplate';
import { FilterStage } from './filterStage';

/**
 * Represents the severity level of a log event.
 */
export enum LogEventLevel {
  off =         0,
  fatal =       1 << 0,
  error =       fatal       | 1 << 1,
  warning =     error       | 1 << 2,
  information = warning     | 1 << 3,
  debug =       information | 1 << 4,
  verbose =     debug       | 1 << 5
}

/**
 * Represents an object that can switch between log levels.
 */
export interface LogEventLevelSwitch<T> {
  fatal(): T;
  error(): T;
  warning(): T;
  information(): T;
  debug(): T;
  verbose(): T;
}

/**
 * Checks if a log event level includes the target log event level.
 * @param {LogEventLevel} level The level to check.
 * @param {LogEventLevel} target The target level.
 * @returns True if the checked level contains the target level.
 */
export function isEnabled(level: LogEventLevel, target: LogEventLevel): boolean {
  return (level & target) === target;
}

/**
 * Represents a log event.
 */
export class LogEvent {
  /**
   * Creates a new log event instance.
   */
  constructor(timestamp: string, level: LogEventLevel, messageTemplate: MessageTemplate, properties?: Object) {
    this.timestamp = timestamp;
    this.level = level;
    this.messageTemplate = messageTemplate;
    this.properties = properties || {};
  }

  /**
   * Gets or sets an ISO 8601-formatted date string for when this event occurred.
   * @example YYYY-MM-DDTHH:mm:ss.sssZ
   */
  timestamp: string;

  /**
   * Gets or sets the severity level of this event.
   */
  level: LogEventLevel;

  /**
   * Gets or sets the message template instance of this event.
   */
  messageTemplate: MessageTemplate;

  /**
   * Gets or sets an object containing the captured properties of this event.
   */
  properties: Object;
}
