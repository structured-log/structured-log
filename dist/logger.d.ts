import { LogEvent } from './logEvent';
import { Pipeline } from './pipeline';
import { Sink } from './sink';
/**
 * Logs events.
 */
export declare class Logger implements Sink {
    private pipeline;
    suppressErrors: boolean;
    /**
     * Creates a new logger instance using the specified pipeline.
     */
    constructor(pipeline: Pipeline, suppressErrors?: boolean);
    /**
     * Logs an event with the {LogEventLevel.fatal} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    fatal(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.fatal} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    fatal(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.error} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    error(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.error} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    error(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.warning} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    warn(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.warning} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    warn(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.information} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    info(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.information} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    info(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.debug} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    debug(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.debug} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    debug(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.verbose} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    verbose(messageTemplate: string, ...properties: any[]): any;
    /**
     * Logs an event with the {LogEventLevel.verbose} severity.
     * @param {Error} error Error for the log event.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    verbose(error: Error, messageTemplate: string, ...properties: any[]): any;
    /**
     * Flushes the pipeline of this logger.
     * @returns A {Promise<any>} that will resolve when the pipeline has been flushed.
     */
    flush(): Promise<any>;
    /**
     * Emits events through this logger's pipeline.
     */
    emit(events: LogEvent[]): LogEvent[];
    private write(level, rawMessageTemplate, unboundProperties, error?);
}
