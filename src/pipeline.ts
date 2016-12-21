import { LogEvent } from './logEvent';
import { Sink } from './sink';
import { PipelineStage } from './pipelineStage';

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
    if (!stage || !(stage instanceof PipelineStage)) {
      throw new Error('Argument "stage" must be a valid Stage instance.');
    }
    this.stages.push(stage);
    if (this.stages.length > 1) {
      this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
    }
  }

  public emit(events: LogEvent[]): Promise<any> {
    if (this.stages.length === 0) {
      return Promise.resolve();
    }

    return this.stages[0].emit(events).catch(e => {
      if (this.yieldErrors) {
        throw e;
      }
    });
  }

  public flush(): Promise<any> {
    if (this.stages.length === 0) {
      return Promise.resolve();
    }

    return this.stages[0].flush().catch(e => {
      if (this.yieldErrors) {
        throw e;
      }
    });
  }
}
