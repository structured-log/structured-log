import { LogEventLevel, LogEvent } from './logEvent';
import { Sink } from './sink';
export interface ConsoleProxy {
    error(message?: any, ...properties: any[]): any;
    warn(message?: any, ...properties: any[]): any;
    info(message?: any, ...properties: any[]): any;
    debug(message?: any, ...properties: any[]): any;
    log(message?: any, ...properties: any[]): any;
}
export interface ConsoleSinkOptions {
    console?: any;
    includeTimestamps?: boolean;
    includeProperties?: boolean;
    restrictedToMinimumLevel?: LogEventLevel;
}
export declare class ConsoleSink implements Sink {
    private options;
    private console;
    constructor(options?: ConsoleSinkOptions);
    emit(events: LogEvent[]): void;
    flush(): Promise<{}>;
    private writeToConsole(logMethod, prefix, e);
}
