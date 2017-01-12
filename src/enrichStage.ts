import { PipelineStage } from './pipeline';
import { LogEvent } from './logEvent';

export type ObjectFactory = () => Object;

export class EnrichStage implements PipelineStage {
  private enricher: Object | ObjectFactory;

  constructor(enricher: Object | ObjectFactory) {
    this.enricher = enricher;
  }

  emit(events: LogEvent[]): LogEvent[] {
    const extraProperties = this.enricher instanceof Function ? this.enricher() : this.enricher;
    for (let i = 0; i < events.length; ++i) {
      Object.assign(events[i].properties, extraProperties);
    }
    return events;
  }

  flush(): Promise<any> {
    return Promise.resolve();
  }
}
