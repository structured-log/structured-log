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

export interface ILogEvent {
  timestamp: string;
  level: LogEventLevel;
  messageTemplate: MessageTemplate;
  properties?: Object;
}
