import { LogEvent } from './logEvent';
import { PipelineStage } from './pipeline';

export interface Sink {
  emit(events: LogEvent[]);
  flush(): Promise<any>;
}

export class SinkStage implements PipelineStage {
  private sink: Sink;

  constructor(sink: Sink) {
    this.sink = sink;
  }

  emit(events: LogEvent[]) {
    this.sink.emit(events);
    return events;
  }

  flush() {
    return this.sink.flush();
  }
}
