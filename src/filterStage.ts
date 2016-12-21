import { ILogEvent } from './logEvent';
import PipelineStage from './pipelineStage';

type Predicate<T> = (T) => boolean;

export class FilterStage extends PipelineStage {
  private filter: Predicate<ILogEvent>;
  constructor(filter: Predicate<ILogEvent>) {
    super();
    this.filter = filter;
  }

  public emit(events: ILogEvent[]): Promise<any> {
    if (!this.next) {
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => events.filter(this.filter))
      .then(filteredEvents => this.next.emit(filteredEvents));
  }
}
