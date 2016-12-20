export default class MessageTemplate {
  private raw: string;
  public properties: Object;

  constructor(messageTemplate: string, ...properties: any[]) {
    this.raw = messageTemplate;
  }

  public render(): string {
    return this.raw;
  }
}
