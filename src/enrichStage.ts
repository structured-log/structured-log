import { LogEvent } from './logEvent';
import { PipelineStage } from './pipelineStage';

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
          e.messageTemplate.enrichWith(this.enricher());
        }
        return events;
      })
      .then(enrichedEvents => this.next.emit(enrichedEvents));
  }
}
