import { LogEventLevel, LogEvent } from './logEvent';
import { MessageTemplate } from './messageTemplate';
import { Pipeline } from './pipeline';
import { Sink } from './sink';

/**
 * Logs events.
 */
export class Logger implements Sink {
  private pipeline: Pipeline;

  /**
   * Creates a new logger instance using the specified pipeline.
   */
  constructor(pipeline: Pipeline) {
    this.pipeline = pipeline;
  }

  /**
   * Logs an event with the {LogEventLevel.fatal} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  fatal(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.fatal, messageTemplate, properties);
  }
  
  /**
   * Logs an event with the {LogEventLevel.error} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  error(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.error, messageTemplate, properties);
  }
  
  /**
   * Logs an event with the {LogEventLevel.warning} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  warn(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.warning, messageTemplate, properties);
  }
  
  /**
   * Logs an event with the {LogEventLevel.information} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  info(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.information, messageTemplate, properties);
  }
  
  /**
   * Logs an event with the {LogEventLevel.debug} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  debug(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.debug, messageTemplate, properties);
  }
  
  /**
   * Logs an event with the {LogEventLevel.verbose} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  verbose(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.verbose, messageTemplate, properties);
  }

  /**
   * Flushes the pipeline of this logger.
   * @returns A {Promise<any>} that will resolve when the pipeline has been flushed.
   */
  flush(): Promise<any> {
    return this.pipeline.flush();
  }

  /**
   * Emits events through this logger's pipeline.
   */
  emit(events: LogEvent[]): LogEvent[] {
    this.pipeline.emit(events);
    return events;
  }

  private write(level: LogEventLevel, rawMessageTemplate: string, unboundProperties: any[]) {
    const messageTemplate = new MessageTemplate(rawMessageTemplate);
    const properties = messageTemplate.bindProperties(unboundProperties);
    const logEvent = new LogEvent(
      new Date().toISOString(),
      level,
      messageTemplate,
      properties
    );
    this.pipeline.emit([logEvent]);
  }
}
