import { ILogEvent } from './logEvent';

/**
 * Represents a stage in the event pipeline.
 */
export default class PipelineStage {

  /**
   * Points to the next stage in the pipeline.
   */
  public next: PipelineStage = null;

  private chain: Promise<any> = Promise.resolve();

  /**
   * Emits events to this pipeline stage, as well as the next stage in the pipeline (if any).
   * @param {LogEvent[]} events The events to emit.
   * @returns {Promise<any>} Promise that will be resolved when all subsequent
   * pipeline stages have resolved.
   */
  public emit(events: ILogEvent[]): Promise<any> {
    return this.chain = this.chain.then(() => this.next ? this.next.emit(events) : Promise.resolve());
  }

  /**
   * Flushes this pipeline stage, as well as the next stage in the pipeline (if any).
   * @returns {Promise<any>} Promise that will be resolved when all subsequent
   * pipeline stages have been flushed.
   */
  public flush(): Promise<any> {
    return this.chain = this.chain.then(() => this.next ? this.next.flush() : Promise.resolve());
  }
}
