import MessageTemplate from './messageTemplate';

export enum LogEventLevel {
  fatal,
  error,
  warn,
  warning = warn,
  info,
  information = info,
  debug,
  verbose
}

export interface LogEvent {
  level: LogEventLevel;
  messageTemplate: MessageTemplate;
}
