import { LogEvent } from './logEvent';
import { PipelineStage } from './pipelineStage';

type Predicate<T> = (T) => boolean;

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
