import { LogEvent, LogEventLevel } from './logEvent';
import { Pipeline } from './pipeline';
import MessageTemplate from './messageTemplate';

export class Logger {
  private pipeline: Pipeline;

  constructor(pipeline: Pipeline) {
    if (!pipeline || !(pipeline instanceof Pipeline)) {
      throw new Error('Argument "pipeline" must be a valid Pipeline instance.');
    }

    this.pipeline = pipeline;
  }

  public fatal(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Fatal, messageTemplate, properties);
  }

  public error(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Error, messageTemplate, properties);
  }

  public warn(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Warning, messageTemplate, properties);
  }

  public info(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Information, messageTemplate, properties);
  }

  public debug(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Debug, messageTemplate, properties);
  }

  public verbose(messageTemplate: string, ...properties: any[]) {
    this.write(LogEventLevel.Verbose, messageTemplate, properties);
  }

  public flush(): Promise<any> {
    return this.pipeline.flush();
  }

  private write(level: LogEventLevel, rawMessageTemplate: string, ...properties: any[]) {
    const messageTemplate = new MessageTemplate(rawMessageTemplate, properties);
    const event: ILogEvent = {
      level,
      messageTemplate
    };
    this.pipeline.emit([event]);
  }
}
