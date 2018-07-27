import { LogEvent } from './logEvent';
export interface PipelineStage {
    emit(events: LogEvent[]): LogEvent[];
    flush(): Promise<any>;
}
export declare class Pipeline {
    private stages;
    private eventQueue;
    private flushInProgress;
    private flushPromise;
    constructor();
    /**
     * Adds a stage to the end of the pipeline.
     * @param {PipelineStage} stage The pipeline stage to add.
     */
    addStage(stage: PipelineStage): void;
    /**
     * Emits events through the pipeline. If a flush is currently in progress, the events will be queued and will been
     * sent through the pipeline once the flush is complete.
     * @param {LogEvent[]} events The events to emit.
     */
    emit(events: LogEvent[]): Promise<any>;
    /**
     * Flushes events through the pipeline.
     * @returns A {Promise<any>} that resolves when all events have been flushed and the pipeline can accept new events.
     */
    flush(): Promise<any>;
}
