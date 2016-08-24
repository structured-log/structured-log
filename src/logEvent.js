export default class LogEvent {
  constructor(timestamp, level, messageTemplate, boundProperties) {
    this.timestamp = timestamp;
    this.level = level;
    this.messageTemplate = messageTemplate;
    this.boundProperties = boundProperties;
  }
}
