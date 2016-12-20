import { LogEvent, LogEventLevel } from './logEvent';
import { Sink } from './sink';

export class ConsoleSink extends Sink {
  public emit(events: LogEvent[]): Promise<any> {
    if (!events) {
      const error = new Error('Argument "events" cannot be null or undefined.');
      return Promise.reject(error);
    }

    return Promise.resolve().then(() => {
      for (let i = 0; i < events.length; ++i) {
        const e = events[i];
        switch (e.level) {
          case LogEventLevel.Fatal:
          case LogEventLevel.Error:
            console.error(`[${LogEventLevel[e.level]}] ${e.messageTemplate.render()}`);
            break;

          case LogEventLevel.Warning:
            console.warn(`[${LogEventLevel[e.level]}] ${e.messageTemplate.render()}`);
            break;

          case LogEventLevel.Information:
            console.info(`[${LogEventLevel[e.level]}] ${e.messageTemplate.render()}`);
            break;

          case LogEventLevel.Debug:
          case LogEventLevel.Verbose:
            console.log(`[${LogEventLevel[e.level]}] ${e.messageTemplate.render()}`);
            break;
        }
      }
    });
  }
}
