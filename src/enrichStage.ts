import { PipelineStage } from './pipeline';
import { LogEvent } from './logEvent';

export type ObjectFactory = (event: LogEvent) => Object;

export class EnrichStage implements PipelineStage {
  private enricher: Object | ObjectFactory;

  constructor(enricher: Object | ObjectFactory) {
    this.enricher = enricher;
  }

  emit(events: LogEvent[]): LogEvent[] {
    for (let i = 0; i < events.length; ++i) {
      const extraProperties = this.enricher instanceof Function ? this.enricher(events[i]) : this.enricher;
      Object.assign(events[i].properties, extraProperties);
    }
    return events;
  }

  flush(): Promise<any> {
    return Promise.resolve();
  }
}
