import { LogEvent } from './logEvent';

export interface PipelineStage {
  emit(events: LogEvent[]): LogEvent[];
  flush(): Promise<any>;
}
