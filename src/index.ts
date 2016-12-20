import { Pipeline, PipelineStage, FilterStage, EnrichStage } from './pipeline';
import { Logger } from './logger';
import { Sink, SinkStage } from './sink';
import { LogEventLevel } from './logEvent';

export { ConsoleSink } from './consoleSink';

export class LoggerConfiguration {
  private pipeline: Pipeline = null;

  constructor() {
    this.pipeline = new Pipeline();
  }

  public writeTo(sink: Sink): LoggerConfiguration {
    this.pipeline.addStage(new SinkStage(sink));
    return this;
  }

  public minLevel(level: LogEventLevel): LoggerConfiguration {
    this.pipeline.addStage(new FilterStage(e => e.level <= level));
    return this;
  }

  public enrich(enricher: any): LoggerConfiguration {
    if (enricher instanceof Function) {
      this.pipeline.addStage(new EnrichStage(enricher));
    } else if (enricher instanceof Object) {
      this.pipeline.addStage(new EnrichStage(() => enricher));
    } else {
      throw new Error('Argument "enricher" must be either a function or an object.');
    }

    return this;
  }

  public create(): Logger {
    if (!this.pipeline) {
      throw new Error('The logger for this configuration has already been created.');
    }

    return new Logger(this.pipeline);
  }
}

export function configure(): LoggerConfiguration {
  return new LoggerConfiguration();
}
