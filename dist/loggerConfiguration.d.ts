import { Logger } from './logger';
import { LogEvent, LogEventLevel, LogEventLevelSwitch } from './logEvent';
import { DynamicLevelSwitch } from './dynamicLevelSwitch';
import { Sink } from './sink';
import { ObjectFactory } from './enrichStage';
export interface MinLevel extends LogEventLevelSwitch<LoggerConfiguration> {
    (levelOrSwitch: LogEventLevel | string | number | DynamicLevelSwitch): LoggerConfiguration;
}
/**
 * Configures pipelines for new logger instances.
 */
export declare class LoggerConfiguration {
    private pipeline;
    private _suppressErrors;
    constructor();
    /**
     * Adds a sink to the pipeline.
     * @param {Sink} sink The sink to add.
     */
    writeTo(sink: Sink): LoggerConfiguration;
    /**
     * Sets the minimum level for any subsequent stages in the pipeline.
     */
    minLevel: MinLevel;
    /**
     * Adds a filter to the pipeline.
     * @param {(e: LogEvent) => boolean} predicate Filter predicate to use.
     */
    filter(predicate: (e: LogEvent) => boolean): LoggerConfiguration;
    /**
     * Adds an enricher to the pipeline.
     */
    enrich(enricher: Object | ObjectFactory): LoggerConfiguration;
    /**
     * Enable or disable error suppression.
     */
    suppressErrors(suppress?: boolean): LoggerConfiguration;
    /**
     * Creates a new logger instance based on this configuration.
     */
    create(): Logger;
}
