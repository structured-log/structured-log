import { LogEvent } from './logEvent';
import { PipelineStage } from './pipeline';
export interface Sink {
    emit(events: LogEvent[]): any;
    flush(): Promise<any>;
}
export declare class SinkStage implements PipelineStage {
    private sink;
    constructor(sink: Sink);
    emit(events: LogEvent[]): LogEvent[];
    flush(): Promise<any>;
}
