import { LogEvent } from './logEvent';
import { Sink } from './sink';
import { Predicate } from './utils';

export abstract class PipelineStage {
  public next: PipelineStage = null;
  public abstract emit(events: LogEvent[]): Promise<void>;
  public flush(): Promise<any> {
    return !!this.next ? this.next.flush() : Promise.resolve();
  }
}

export class Pipeline {
  private stages: PipelineStage[];

  constructor() {
    this.stages = [];
  }

  public addStage(stage: PipelineStage) {
    if (!stage || !(stage instanceof PipelineStage)) {
      throw new Error('Argument "stage" must be a valid Stage instance.');
    }
    this.stages.push(stage);
    if (this.stages.length > 1) {
      this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
    }
  }

  emit(events: LogEvent[]): Promise<any> {
    if (this.stages.length === 0) {
      return Promise.resolve();
    }

    return this.stages[0].emit(events);
  }

  flush(): Promise<any> {
    if (this.stages.length === 0) {
      return Promise.resolve();
    }

    return this.stages[0].flush();
  }
}

export class FilterStage extends PipelineStage {
  private filter: Predicate<LogEvent>;
  constructor(filter: Predicate<LogEvent>) {
    super();
    this.filter = filter;
  }

  public emit(events: LogEvent[]): Promise<any> {
    if (!this.next) {
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => events.filter(this.filter))
      .then(filteredEvents => this.next.emit(filteredEvents));
  }
}

export class EnrichStage extends PipelineStage {
  private enricher: () => Object;
  constructor(enricher: () => Object) {
    super();
    this.enricher = enricher;
  }

  public emit(events: LogEvent[]): Promise<any> {
    if (!this.next) {
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => {
        for (var i = 0; i < events.length; ++i) {
          const e = events[i];
          e.messageTemplate.properties = Object.assign({}, e.messageTemplate.properties, this.enricher());
        }
        return events;
      })
      .then(enrichedEvents => this.next.emit(enrichedEvents));
  }
}
