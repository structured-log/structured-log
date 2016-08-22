const argRegex = /\{@?\w+}/g;

function capture(o, destructure) {
  if (typeof o === 'function') {
    return o.toString();
  }

  if (typeof o === 'object') {
    // null value will be automatically stringified as "null", in properties it will be as null
    // otherwise it will throw an error
    if (o === null) {
      return o;
    }

    // Could use instanceof Date, but this way will be kinder
    // to values passed from other contexts...
    if (destructure || typeof o.toISOString === 'function') {
      return o;
    }

    return o.toString();
  }

  return o;
}

const toText = function(o) {
  if (typeof o === 'undefined') {
    return 'undefined';
  }

  if (o === null) {
    return 'null';
  }

  if (typeof o === 'string') {
    return o;
  }

  if (typeof o === 'number') {
    return o.toString();
  }

  if (typeof o === 'boolean') {
    return o.toString();
  }

  if (typeof o.toISOString === 'function') {
    return o.toISOString();
  }

  if (typeof o === 'object') {
    let s = JSON.stringify(o);
    if (s.length > 70) {
      s = s.slice(0, 67) + '...';
    }

    return s;
  }

  return o.toString();
};

class MessageTemplate {
  constructor(template) {
    this.raw = template;
    this.tokens = [];

    let result;
    let textStart;

    while ((result = argRegex.exec(template)) !== null) {
      if (result.index !== textStart) {
        this.tokens.push({ text: template.slice(textStart, result.index) });
      }

      let destructure = false;

      let token = result[0].slice(1, -1);
      if (token.indexOf('@') === 0) {
        token = token.slice(1);
        destructure = true;
      }

      this.tokens.push({
        name: token,
        destructure,
        raw: result[0]
      });
      textStart = argRegex.lastIndex;
    }

    if (textStart >= 0 && textStart < template.length) {
      this.tokens.push({ text: template.slice(textStart) });
    }
  }

  bindProperties = positionalArgs => {
    const result = {};
    let nextArg = 0;
    for (var i = 0; i < this.tokens.length && nextArg < positionalArgs.length; ++i) {
      const token = this.tokens[i];
      if (typeof token.name === 'string') {
        let p = positionalArgs[nextArg];
        result[token.name] = capture(p, token.destructure);
        nextArg++;
      }
    }

    while (nextArg < positionalArgs.length) {
      const arg = positionalArgs[nextArg];
      if (typeof arg !== 'undefined') {
        result['a' + nextArg] = capture(arg);
      }
      nextArg++;
    }

    return result;
  }

  render = properties => {
    const result = [];
    for (var i = 0; i < this.tokens.length; ++i) {
      const token = this.tokens[i];
      if (typeof token.name === 'string') {
        if (properties.hasOwnProperty(token.name)) {
          result.push(toText(properties[token.name]));
        } else {
          result.push(token.raw);
        }
      } else {
        result.push(token.text);
      }
    }
    return result.join('');
  }
}

export default MessageTemplate;
