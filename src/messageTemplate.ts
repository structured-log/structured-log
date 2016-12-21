const tokenizer = /\{@?\w+}/g;

interface Token {
  name?: string;
  text?: string;
  destructure?: boolean;
  raw?: string;
}

export default class MessageTemplate {
  private template: string;
  private tokens: Token[];
  private properties: Object;

  constructor(messageTemplate: string, ...properties: any[]) {
    this.template = messageTemplate;
    this.tokens = this.tokenize(messageTemplate);
    this.properties = Object.assign({}, properties);
  }

  public render(): string {
    return this.template;
  }

  public enrichWith(properties) {
    Object.assign(this.properties, properties);
  }

  private tokenize(template: string): Token[] {
    const tokens = [];

    let result;
    let textStart;

    while ((result = tokenizer.exec(template)) !== null) {
      if (result.index !== textStart) {
        tokens.push({ text: template.slice(textStart, result.index) });
      }

      let destructure = false;

      let token = result[0].slice(1, -1);
      if (token.indexOf('@') === 0) {
        token = token.slice(1);
        destructure = true;
      }

      tokens.push({
        name: token,
        destructure,
        raw: result[0]
      });

      textStart = tokenizer.lastIndex;
    }

    if (textStart >= 0 && textStart < template.length) {
      tokens.push({ text: template.slice(textStart) });
    }

    return tokens;
  }
}
