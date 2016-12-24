import './polyfill/objectAssign';

import { LogEventLevel } from './logEvent';
import { LoggerConfiguration } from './loggerConfiguration';

export { ConsoleSink } from './consoleSink';
export { LoggerConfiguration };

export function configure(): LoggerConfiguration {
  return new LoggerConfiguration();
}
