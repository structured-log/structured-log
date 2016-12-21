import { LogEvent } from './logEvent';
import { PipelineStage } from './pipeline';

export abstract class Sink {
  public abstract emit(events: LogEvent[]): Promise<any>;

  public flush(): Promise<any> {
    return Promise.resolve();
  }
}

export class SinkStage extends PipelineStage {
  private sink: Sink;
  constructor (sink: Sink) {
    super();
    if (!sink || !(sink instanceof Sink)) {
      throw new Error('Argument "sink" must be a valid Sink instance.');
    }
    this.sink = sink;
  }

  public emit(events: LogEvent[]): Promise<any> {
    return Promise.all([this.sink.emit(events), this.next ? this.next.emit(events) : Promise.resolve()]);
  }

  public flush(): Promise<any> {
    return Promise.all([this.sink.flush(), super.flush()]);
  }
}
