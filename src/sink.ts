import { ILogEvent } from './logEvent';

export abstract class Sink {
  public abstract emit(events: ILogEvent[]): Promise<any>;

  public flush(): Promise<any> {
    return Promise.resolve();
  }
}
