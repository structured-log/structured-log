export default class LogEvent {
  constructor(timestamp, level, messageTemplate, properties) {
    this.timestamp = timestamp || null;
    this.level = level || null;
    this.messageTemplate = messageTemplate || {};
    this.properties = properties || {};
  }
}
