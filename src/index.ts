import './polyfill/objectAssign';

import { LogEventLevel } from './logEvent';
import { LoggerConfiguration } from './loggerConfiguration';

export { ConsoleSink } from './consoleSink';
export { LoggerConfiguration };
export { LogEventLevelSwitch } from './logEventLevelSwitch';

export function configure(): LoggerConfiguration {
  return new LoggerConfiguration();
}
