import { LogEventLevel, LogEvent, isEnabled } from './logEvent';
import { Sink } from './sink';
import { MessageTemplate } from './messageTemplate';

export interface BatchedSinkOptions {

  /**
   * Maximum number of events to be sent in a single batch.
   */
  maxSize?: number;

  /**
   * Number of seconds to wait between checking for batches.
   */
  period?: number;
}

const defaultBatchedSinkOptions: BatchedSinkOptions = {
  maxSize: 100,
  period: 10
};

export class BatchedSink implements Sink {
  protected options: BatchedSinkOptions;
  protected innerSink: Sink;
  protected batchedEvents: LogEvent[];
  private batchTimeout;

  constructor(innerSink?: Sink, options?: BatchedSinkOptions) {
    this.innerSink = innerSink || null;
    this.options = { 
      ...defaultBatchedSinkOptions,
      ...(options || {})
    };
    this.batchedEvents = [];
    this.cycleBatch();
  }

  emit(events: LogEvent[]) {
    if (isNaN(this.options.period) || this.options.period <= 0) {
      return this.innerSink.emit(events);
    }

    if (this.batchedEvents.length + events.length <= this.options.maxSize) {
      this.batchedEvents.push(...events);
    } else {
      let cursor = this.options.maxSize - this.batchedEvents.length;
      this.batchedEvents.push(...events.slice(0, cursor));
      while (cursor < events.length) {
        this.cycleBatch();
        this.batchedEvents.push(...events.slice(cursor, cursor = cursor + this.options.maxSize));
      }
    }

    return events;
  }

  flush(): Promise<any> {
    this.cycleBatch();
    const corePromise = this.flushCore();
    return corePromise instanceof Promise ? corePromise : Promise.resolve();
  }

  protected emitCore(events: LogEvent[]) {
    return this.innerSink.emit(events);
  }

  protected flushCore(): Promise<any> {
    return this.innerSink.flush();
  }

  protected cycleBatch() {
    if (isNaN(this.options.period) || this.options.period <= 0) {
      return;
    }

    clearTimeout(this.batchTimeout);
    if (this.batchedEvents.length) {
      this.emitCore(this.batchedEvents.slice(0));
      this.batchedEvents.length = 0;
    }
    this.batchTimeout = setTimeout(() => this.cycleBatch(), this.options.period * 1000);
  }
}
