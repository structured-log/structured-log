export default class LogEvent {
  constructor(timestamp, level, messageTemplate, properties) {
    this.timestamp = timestamp;
    this.level = level;
    this.messageTemplate = messageTemplate;
    this.properties = properties;
  }
}
