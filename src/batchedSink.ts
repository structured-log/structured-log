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

  /**
   * {Storage} instance to be used for durable storage of log events.
   */
  durableStore?: Storage;
}

export const defaultBatchedSinkOptions: BatchedSinkOptions = {
  maxSize: 100,
  period: 5,
  durableStore: null
};

export class BatchedSink implements Sink {
  protected durableStorageKey: string = 'structured-log-batched-sink-durable-cache';

  protected options: BatchedSinkOptions;
  protected innerSink: Sink;
  protected batchedEvents: LogEvent[];
  private batchTimeout;
  private batchKey;

  constructor(innerSink?: Sink, options?: BatchedSinkOptions) {
    this.innerSink = innerSink || null;
    this.options = {
      ...defaultBatchedSinkOptions,
      ...(options || {})
    };
    this.batchedEvents = [];
    this.cycleBatch();
    if (this.options.durableStore) {
      let initialBatch = [];
      for (const key in this.options.durableStore) {
        if (key.indexOf(this.durableStorageKey) === 0) {
          const storedEvents = JSON.parse(this.options.durableStore.getItem(key))
            .map(e => {
              e.messageTemplate = new MessageTemplate(e.messageTemplate.raw);
              return e;
            });
          initialBatch = initialBatch.concat(storedEvents);
          this.options.durableStore.removeItem(key);
        }
      }
      this.emit(initialBatch);
    }
  }

  emit(events: LogEvent[]) {
    if (this.batchedEvents.length + events.length <= this.options.maxSize) {
      this.batchedEvents.push(...events);
      this.storeEvents();
    } else {
      let cursor = this.options.maxSize - this.batchedEvents.length < 0 ? 0 :
          this.options.maxSize - this.batchedEvents.length;
      this.batchedEvents.push(...events.slice(0, cursor));
      this.storeEvents();
      while (cursor < events.length) {
        this.cycleBatch();
        this.batchedEvents.push(...events.slice(cursor, cursor = cursor + this.options.maxSize));
        this.storeEvents();
      }
    }

    return events;
  }

  flush(): Promise<any> {
    this.cycleBatch();
    const corePromise = this.flushCore();
    return corePromise instanceof Promise ? corePromise : Promise.resolve();
  }

  protected emitCore(events: LogEvent[]): any {
    return this.innerSink.emit(events);
  }

  protected flushCore(): Promise<any> {
    return this.innerSink.flush();
  }

  protected cycleBatch() {
    clearTimeout(this.batchTimeout);
    if (this.batchedEvents.length) {
      var processEvents = this.batchedEvents.slice(0);
      this.batchedEvents.length = 0;
      const emitPromise = this.emitCore(processEvents);
      (emitPromise instanceof Promise ? emitPromise : Promise.resolve())
          .then(() => {
            if(this.options.durableStore){
              const previousBatchKey = this.batchKey;
              return this.options.durableStore.removeItem(previousBatchKey)
            }
          }).catch(() => {
            this.batchedEvents.unshift(...processEvents)
          })
    }
    this.batchKey = `${this.durableStorageKey}-${new Date().getTime()}`;
    if (!isNaN(this.options.period) && this.options.period > 0) {
      this.batchTimeout = setTimeout(() => this.cycleBatch(), this.options.period * 1000);
    }
  }

  private storeEvents() {
    if (this.options.durableStore) {
      this.options.durableStore.setItem(this.batchKey, JSON.stringify(this.batchedEvents));
    }
  }
}
