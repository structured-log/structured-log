import MessageTemplate from './messageTemplate';

export enum LogEventLevel {
  Fatal,
  Error,
  Warning,
  Information,
  Debug,
  Verbose
}

export interface LogEvent {
  level: LogEventLevel;
  messageTemplate: MessageTemplate;
}
