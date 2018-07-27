import { LogEventLevel, LogEventLevelSwitch } from './logEvent';
import { FilterStage } from './filterStage';
/**
 * Allows dynamic control of the logging level.
 */
export declare class DynamicLevelSwitch implements LogEventLevelSwitch<Promise<any>> {
    private minLevel;
    /**
     * Gets or sets a delegate that can be called when the pipeline needs to be flushed.
     * This should generally not be modified, as it will be provided by the pipeline stage.
     */
    flushDelegate: () => Promise<any>;
    fatal(): Promise<LogEventLevel>;
    error(): Promise<LogEventLevel>;
    warning(): Promise<LogEventLevel>;
    information(): Promise<LogEventLevel>;
    debug(): Promise<LogEventLevel>;
    verbose(): Promise<LogEventLevel>;
    off(): Promise<LogEventLevel>;
    isEnabled(level: LogEventLevel): boolean;
}
export declare class DynamicLevelSwitchStage extends FilterStage {
    private dynamicLevelSwitch;
    /**
     * Sets a delegate that can be called when the pipeline needs to be flushed.
     */
    setFlushDelegate(flushDelegate: () => Promise<any>): void;
    constructor(dynamicLevelSwitch: DynamicLevelSwitch);
}
