import { PipelineStage } from './pipeline';
import { LogEvent } from './logEvent';

export class FilterStage implements PipelineStage {
  private predicate: (e: LogEvent) => boolean;

  constructor(predicate: (e: LogEvent) => boolean) {
    this.predicate = predicate;
  }

  emit(events: LogEvent[]): LogEvent[] {
    return events.filter(this.predicate);
  }

  flush(): Promise<any> {
    return Promise.resolve();
  }
}
