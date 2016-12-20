import { ILogEvent } from './logEvent';
import { PipelineStage } from './pipeline';

export abstract class Sink {
  public emit(events: ILogEvent[]): Promise<any> {
    return Promise.resolve();
  }

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

  emit(events: ILogEvent[]): Promise<any> {
    return Promise.all([this.sink.emit(events), this.next ? this.next.emit(events) : Promise.resolve()]);
  }

  flush(): Promise<any> {
    return Promise.all([this.sink.flush(), super.flush()]);
  }
}
