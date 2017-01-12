import { LogEvent } from './logEvent';

export interface PipelineStage {
  emit(events: LogEvent[]): LogEvent[];
  flush(): Promise<any>;
}

export class Pipeline {
  private stages: PipelineStage[];
  private eventQueue: LogEvent[];
  private flushInProgress: boolean;
  private flushPromise: Promise<any>;

  constructor() {
    this.stages = [];
    this.eventQueue = [];
    this.flushInProgress = false;
  }

  /**
   * Adds a stage to the end of the pipeline.
   * @param {PipelineStage} stage The pipeline stage to add.
   */
  addStage(stage: PipelineStage) {
    this.stages.push(stage);
  }

  /**
   * Emits events through the pipeline. If a flush is currently in progress, the events will be queued and will been
   * sent through the pipeline once the flush is complete.
   * @param {LogEvent[]} events The events to emit.
   */
  emit(events: LogEvent[]): Promise<any> {
    if (this.flushInProgress) {
      this.eventQueue = this.eventQueue.concat(events);
      return this.flushPromise;
    } else {
      if (!this.stages.length || !events.length) {
        return Promise.resolve();
      }

      let promise = Promise.resolve(this.stages[0].emit(events));
      for (let i = 1; i < this.stages.length; ++i) {
        promise = promise.then(events => this.stages[i].emit(events));
      }

      return promise;
    }
  }

  /**
   * Flushes events through the pipeline.
   * @returns A {Promise<any>} that resolves when all events have been flushed and the pipeline can accept new events.
   */
  flush(): Promise<any> {
    if (this.flushInProgress) {
      return this.flushPromise;
    }

    this.flushInProgress = true;
    return this.flushPromise = Promise.resolve()
      .then(() => {
        if (this.stages.length === 0) {
          return;
        }

        let promise = this.stages[0].flush();
        for (let i = 1; i < this.stages.length; ++i) {
          promise = promise.then(() => this.stages[i].flush());
        }
        return promise;
      })
      .then(() => {
        this.flushInProgress = false;
        const queuedEvents = this.eventQueue.slice();
        this.eventQueue = [];
        return this.emit(queuedEvents);
      });
  }
}
