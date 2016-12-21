import { LogEvent } from './logEvent';
import { Sink } from './sink';
import { PipelineStage } from './pipelineStage';

/**
 * Represents a stage in the pipeline that emits events to a sink.
 */
export class SinkStage extends PipelineStage {
  private sink: Sink;
  constructor (sink: Sink) {
    super();
    if (!sink) {
      throw new Error('Argument "sink" cannot be null or undefined.');
    }
    this.sink = sink;
  }

  /**
   * Emits events to the sink, as well as the next stage in the pipeline (if any).
   * @param {LogEvent[]} events The events to emit.
   * @returns {Promise<void>} Promise that will be resolved when all subsequent
   * pipeline stages have resolved.
   */
  public emit(events: LogEvent[]): Promise<any> {
    return Promise.all([this.sink.emit(events), super.emit(events)]);
  }

  /**
   * Flushes the sink, as well as the next stage in the pipeline (if any).
   */
  public flush(): Promise<any> {
    return Promise.all([this.sink.flush(), super.flush()]);
  }
}
