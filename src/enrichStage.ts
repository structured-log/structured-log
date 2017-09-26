import { PipelineStage } from './pipeline';
import { LogEvent } from './logEvent';

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export type ObjectFactory = (properties?: Object) => Object;

export class EnrichStage implements PipelineStage {
  private enricher: Object | ObjectFactory;

  constructor(enricher: Object | ObjectFactory) {
    this.enricher = enricher;
  }

  emit(events: LogEvent[]): LogEvent[] {
    for (let i = 0; i < events.length; ++i) {
      const extraProperties = this.enricher instanceof Function
        ? this.enricher(deepClone(events[i].properties))
        : this.enricher;
      Object.assign(events[i].properties, extraProperties);
    }
    return events;
  }

  flush(): Promise<any> {
    return Promise.resolve();
  }
}
