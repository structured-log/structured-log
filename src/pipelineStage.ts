import { LogEvent } from './logEvent';

/**
 * Represents a stage in the event pipeline.
 */
export abstract class PipelineStage {

  /**
   * Points to the next stage in the pipeline.
   */
  public next: PipelineStage = null;

  /**
   * Emits events to this pipeline stage, as well as the next stage in the pipeline (if any).
   * @param {LogEvent[]} events The events to emit.
   * @returns {Promise<void>} Promise that will be resolved when all subsequent
   * pipeline stages have resolved.
   */
  public emit(events: LogEvent[]): Promise<void> {
    return this.next ? this.next.emit(events) : Promise.resolve();
  }

  /**
   * Flushes this pipeline stage, as well as the next stage in the pipeline (if any).
   */
  public flush(): Promise<any> {
    return this.next ? this.next.flush() : Promise.resolve();
  }
}
