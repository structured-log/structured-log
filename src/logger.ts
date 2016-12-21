import { LogEvent, LogEventLevel } from './logEvent';
import { Pipeline } from './pipeline';
import { Sink } from './sink';
import MessageTemplate from './messageTemplate';

export class Logger extends Sink {
  private pipeline: Pipeline;

  constructor(pipeline: Pipeline) {
    super();

    if (!pipeline) {
      throw new Error('Argument "pipeline" cannot be null or undefined.');
    }

    this.pipeline = pipeline;
  }

  /**
   * Logs a message with the `Fatal` level.
   */
  public fatal(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.fatal, messageTemplate, properties);
  }

  /**
   * Logs a message with the `Error` level.
   */
  public error(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.error, messageTemplate, properties);
  }

  /**
   * Logs a message with the `Warning` level.
   */
  public warn(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.warning, messageTemplate, properties);
  }

  /**
   * Logs a message with the `Information` level.
   */
  public info(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.information, messageTemplate, properties);
  }

  /**
   * Logs a message with the `Debug` level.
   */
  public debug(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.debug, messageTemplate, properties);
  }

  /**
   * Logs a message with the `Verbose` level.
   */
  public verbose(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.verbose, messageTemplate, properties);
  }

  /**
   * @inheritdoc
   */
  public flush(): Promise<any> {
    return this.pipeline.flush();
  }

  public emit(events: LogEvent[]): Promise<any> {
    return this.pipeline.emit(events);
  }

  private write(level: LogEventLevel, rawMessageTemplate: string, ...properties: any[]) {
    try {
      const messageTemplate = new MessageTemplate(rawMessageTemplate);
      const eventProperties = messageTemplate.bindProperties(properties);
      const event: LogEvent = {
        timestamp: new Date().toISOString(),
        level,
        messageTemplate,
        properties: eventProperties
      };
      this.pipeline.emit([event]);
    } catch (error) {
      if (this.pipeline.yieldErrors) {
        throw error;
      }
    }
  }
}
