import { ILogEvent } from './logEvent';
import { Sink } from './sink';
import PipelineStage from './pipelineStage';

/**
 * Represents a stage in the pipeline that emits events to a sink.
 */
export class SinkStage extends PipelineStage {
  private sink: Sink;
  constructor (sink: Sink) {
    super();
    if (typeof sink === 'undefined' || !sink) {
      throw new Error('Argument "sink" cannot be undefined or null.');
    }
    this.sink = sink;
  }

  /**
   * Emits events to the sink, as well as the next stage in the pipeline (if any).
   * @param {LogEvent[]} events The events to emit.
   * @returns {Promise<void>} Promise that will be resolved when all subsequent
   * pipeline stages have resolved.
   */
  public emit(events: ILogEvent[]): Promise<any> {
    return Promise.all([super.emit(events), this.sink.emit(events)]);
  }

  /**
   * Flushes the sink, as well as the next stage in the pipeline (if any).
   */
  public flush(): Promise<any> {
    return Promise.all([super.flush(), this.sink.flush()]);
  }
}
