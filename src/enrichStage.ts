import { ILogEvent } from './logEvent';
import PipelineStage from './pipelineStage';

export class EnrichStage extends PipelineStage {
  private enricher: () => Object;
  constructor(enricher: () => Object) {
    super();
    this.enricher = enricher;
  }

  public emit(events: ILogEvent[]): Promise<any> {
    if (!this.next) {
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => {
        for (var i = 0; i < events.length; ++i) {
          const e = events[i];
          e.properties = Object.assign({}, e.properties, this.enricher());
        }
        return events;
      })
      .then(enrichedEvents => super.emit(enrichedEvents));
  }
}
