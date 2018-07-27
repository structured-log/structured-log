import { LogEvent } from './logEvent';
import { Sink } from './sink';
export interface BatchedSinkOptions {
    /**
     * Maximum number of events to be sent in a single batch.
     */
    maxSize?: number;
    /**
     * Number of seconds to wait between checking for batches.
     */
    period?: number;
    /**
     * {Storage} instance to be used for durable storage of log events.
     */
    durableStore?: Storage;
}
export declare const defaultBatchedSinkOptions: BatchedSinkOptions;
export declare class BatchedSink implements Sink {
    protected durableStorageKey: string;
    protected options: BatchedSinkOptions;
    protected innerSink: Sink;
    protected batchedEvents: LogEvent[];
    private batchTimeout;
    private batchKey;
    constructor(innerSink?: Sink, options?: BatchedSinkOptions);
    emit(events: LogEvent[]): LogEvent[];
    flush(): Promise<any>;
    protected emitCore(events: LogEvent[]): any;
    protected flushCore(): Promise<any>;
    protected cycleBatch(): void;
    private storeEvents();
}
