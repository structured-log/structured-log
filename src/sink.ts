import { LogEvent } from './logEvent';

export abstract class Sink {
  public abstract emit(events: LogEvent[]): Promise<any>;

  public flush(): Promise<any> {
    return Promise.resolve();
  }
}
