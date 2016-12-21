import { LogEvent, LogEventLevel } from './logEvent';
import { Pipeline } from './pipeline';
import { Sink } from './sink';
import MessageTemplate from './messageTemplate';

export class Logger extends Sink {
  private pipeline: Pipeline;

  constructor(pipeline: Pipeline) {
    super();

    if (!pipeline || !(pipeline instanceof Pipeline)) {
      throw new Error('Argument "pipeline" must be a valid Pipeline instance.');
    }

    this.pipeline = pipeline;
  }

  public fatal(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.fatal, messageTemplate, properties);
  }

  public error(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.error, messageTemplate, properties);
  }

  public warn(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.warning, messageTemplate, properties);
  }

  public info(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.information, messageTemplate, properties);
  }

  public debug(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.debug, messageTemplate, properties);
  }

  public verbose(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.verbose, messageTemplate, properties);
  }

  public flush(): Promise<any> {
    return this.pipeline.flush();
  }

  public emit(events: LogEvent[]): Promise<any> {
    return this.pipeline.emit(events);
  }

  private write(level: LogEventLevel, rawMessageTemplate: string, ...properties: any[]) {
    try {
      const messageTemplate = new MessageTemplate(rawMessageTemplate, properties);
      const event: LogEvent = {
        level,
        messageTemplate
      };
      this.pipeline.emit([event]);
    } catch (error) {
      if (this.pipeline.yieldErrors) {
        throw error;
      }
    }
  }
}
