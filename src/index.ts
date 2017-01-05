import './polyfills/objectAssign';

export { LogEventLevel } from './logEvent';
export { Logger } from './logger';
export { ConsoleSink } from './consoleSink';

import { LoggerConfiguration } from './loggerConfiguration';

export function configure() {
  return new LoggerConfiguration();
}

export { LoggerConfiguration };
