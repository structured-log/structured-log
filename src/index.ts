import './polyfills/objectAssign';

export { LogEventLevel } from './logEvent';
export { Logger } from './logger';
export { ConsoleSink } from './consoleSink';
export { BatchedSink } from './batchedSink';
export { DynamicLevelSwitch } from './dynamicLevelSwitch';

import { LoggerConfiguration } from './loggerConfiguration';

export function configure() {
  return new LoggerConfiguration();
}

export { LoggerConfiguration };
