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
  fatal(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.fatal} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  fatal(error: Error, messageTemplate: string, ...properties: any[]);

  fatal(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.fatal, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.fatal, errorOrMessageTemplate, properties);
    }
  }
  
  /**
   * Logs an event with the {LogEventLevel.error} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  error(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.error} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  error(error: Error, messageTemplate: string, ...properties: any[]);

  error(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.error, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.error, errorOrMessageTemplate, properties);
    }
  }
  
  /**
   * Logs an event with the {LogEventLevel.warning} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  warn(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.warning} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  warn(error: Error, messageTemplate: string, ...properties: any[]);

  warn(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.warning, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.warning, errorOrMessageTemplate, properties);
    }
  }
  
  /**
   * Logs an event with the {LogEventLevel.information} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  info(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.information} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  info(error: Error, messageTemplate: string, ...properties: any[]);

  info(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.information, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.information, errorOrMessageTemplate, properties);
    }
  }
  
  /**
   * Logs an event with the {LogEventLevel.debug} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  debug(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.debug} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  debug(error: Error, messageTemplate: string, ...properties: any[]);

  debug(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.debug, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.debug, errorOrMessageTemplate, properties);
    }
  }
  
  /**
   * Logs an event with the {LogEventLevel.verbose} severity.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  verbose(messageTemplate: string, ...properties: any[]);

  /**
   * Logs an event with the {LogEventLevel.verbose} severity.
   * @param {Error} error Error for the log event.
   * @param {string} messageTemplate Message template for the log event.
   * @param {any[]} properties Properties that can be used to render the message template.
   */
  verbose(error: Error, messageTemplate: string, ...properties: any[]);

  verbose(errorOrMessageTemplate: any, ...properties: any[]) {
    if (errorOrMessageTemplate instanceof Error) {
      this.write(LogEventLevel.verbose, properties[0], properties.slice(1), errorOrMessageTemplate);
    } else {
      this.write(LogEventLevel.verbose, errorOrMessageTemplate, properties);
    }
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

  private write(level: LogEventLevel, rawMessageTemplate: string, unboundProperties: any[], error?: Error) {
    const messageTemplate = new MessageTemplate(rawMessageTemplate);
    const properties = messageTemplate.bindProperties(unboundProperties);
    const logEvent = new LogEvent(
      new Date().toISOString(),
      level,
      messageTemplate,
      properties,
      error
    );
    this.pipeline.emit([logEvent]);
  }
}
