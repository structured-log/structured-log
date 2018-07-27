import { MessageTemplate } from './messageTemplate';
/**
 * Represents the severity level of a log event.
 */
export declare enum LogEventLevel {
    off = 0,
    fatal = 1,
    error = 3,
    warning = 7,
    information = 15,
    debug = 31,
    verbose = 63,
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
 * @returns True if the checked level contains the target level, or if the checked level is undefined.
 */
export declare function isEnabled(level: LogEventLevel, target: LogEventLevel): boolean;
/**
 * Represents a log event.
 */
export declare class LogEvent {
    /**
     * Creates a new log event instance.
     */
    constructor(timestamp: string, level: LogEventLevel, messageTemplate: MessageTemplate, properties?: Object, error?: Error);
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
    /**
     * Gets or sets an error associated with this event.
     */
    error: Error;
}
