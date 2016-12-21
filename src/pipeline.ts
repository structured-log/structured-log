import { ILogEvent } from './logEvent';
import { Sink } from './sink';
import PipelineStage from './pipelineStage';

/**
 * Represents the event pipeline.
 */
export class Pipeline {

  /**
   * If set to `true`, errors in the pipeline will not be caught and will be
   * allowed to propagate out to the execution environment.
   */
  public yieldErrors: boolean = false;

  private stages: PipelineStage[];

  /**
   * Creates a new Pipeline instance.
   */
  constructor() {
    this.stages = [];
  }

  /**
   * Adds a new stage to the pipeline, and connects it to the previous stage.
   * @param {PipelineStage} stage The stage to add.
   */
  public addStage(stage: PipelineStage) {
    if (typeof stage === 'undefined' || !stage) {
      throw new Error('Argument "stage" cannot be undefined or null.');
    }
    this.stages.push(stage);
    if (this.stages.length > 1) {
      this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
    }
  }

  /**
   * Emits events through the pipeline.
   * @param {LogEvent[]} events The events to emit.
   * @returns {Promise<any>} Promise that will be resolved when all
   * pipeline stages have resolved.
   */
  public emit(events: ILogEvent[]): Promise<any> {
    try {
      if (this.stages.length === 0) {
        return Promise.resolve();
      }

      return this.stages[0].emit(events).catch(e => {
        if (this.yieldErrors) {
          throw e;
        }
      });
    } catch (e) {
      if (!this.yieldErrors) {
        return Promise.resolve();
      } else {
          throw e;
      }
    }
  }

  /**
   * Flushes any events through the pipeline
   * @returns {Promise<any>} Promise that will be resolved when all
   * pipeline stages have been flushed.
   */
  public flush(): Promise<any> {
    try {
      if (this.stages.length === 0) {
        return Promise.resolve();
      }

      return this.stages[0].flush().catch(e => {
        if (this.yieldErrors) {
          throw e;
        }
      });
    } catch (e) {
      if (!this.yieldErrors) {
        return Promise.resolve();
      } else {
          throw e;
      }
    }
  }
}
