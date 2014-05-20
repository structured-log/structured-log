(function(){
  var parseMessageTemplate = function(messageTemplate) {
    var result = [];

    var ptre = /\{@?\w+}/g;
    var res;
    var textStart = 0;
    while ((res = ptre.exec(messageTemplate)) !== null)
    {
      if (res.index !== textStart) {
        result.push({text: messageTemplate.slice(textStart, res.index)});
      }

      var destructure = false;

      var tok = res[0].slice(1, -1);
      if (tok.indexOf('@') === 0) {
        tok = tok.slice(1);
        destructure = true;
      }

      result.push({name: tok, destructure: destructure, raw: res[0]});
      textStart = ptre.lastIndex;
    }

    if (textStart >= 0 && textStart < messageTemplate.length) {
      result.push({text: messageTemplate.slice(textStart)});
    }

    return result;
  };

  var bindMessageTemplateProperties = function(messageTemplate, positionalArgs) {
    var result = {};

    var nextArg = 0;
    for(var i = 0; i < messageTemplate.length && nextArg < positionalArgs.length; ++i) {
      var token = messageTemplate[i];
      if (typeof token.name === 'string') {
        result[token.name] = positionalArgs[nextArg];
        nextArg++;
      }
    }

    while (nextArg < positionalArgs.length) {
      var p = positionalArgs[nextArg];
      if (typeof p !== 'undefined') {
        result['a' + nextArg] = p;
      }
      nextArg++;
    }

    return result;
  };

  var renderMessageTemplate = function(messageTemplate, properties) {
    var result = [];
    for (var i = 0; i < messageTemplate.length; ++i) {
      var token = messageTemplate[i];
      if (typeof token.name === 'string') {
        if (properties.hasOwnProperty(token.name)) {
          result.push((properties[token.name] || '').toString());
        } else {
          result.push(token.raw);
        }
      } else {
        result.push(token.text);
      }
    }
    return result.join('');
  };

  var LogEvent = function(timestamp, level, messageTemplate, properties) {
    var self = this;

    self.timestamp = timestamp;
    self.level = level;
    self.messageTemplate = messageTemplate;
    self.properties = properties;
    self.renderedMessage = function() {
      return renderMessageTemplate(messageTemplate, properties);
    };
  };

  var LevelMap = function(initial) {
    var self = this;

    var levels = {};

    if (initial !== 'OFF') {
      var sequence = ['ERROR', 'WARNING', 'INFORMATION', 'TRACE'];

      var below = false;
      for (var i = 0; i < sequence.length; ++i) {
        var level = sequence[i];
        levels[level] = !below;
        if (level === initial) {
          below = true;
        }
      }
    }

    self.isEnabled = function(level) {
      return levels[level || 'NONE'] || false;
    };
  };

  var createLogger = function(levelMap, pipeline) {
    var self = function() {
      self.information.apply(null, arguments);
    };

    var invoke = function(level, messageTemplate, args) {
      if (!levelMap.isEnabled(level)) {
        return;
      }

      var parsedTemplate = parseMessageTemplate(messageTemplate);
      var boundProperties = bindMessageTemplateProperties(parsedTemplate, args);

      var event = new LogEvent(new Date(), level, parsedTemplate, boundProperties);

      var execute = function(evt, pipelineIndex) {
        if (pipelineIndex >= pipeline.length) {
          return;
        }

        var element = pipeline[pipelineIndex];
        element(evt, function(evnext) {
          execute(evnext, pipelineIndex + 1);
        });
      };

      return execute(event, 0);
    };

    self.write = function(level, messageTemplate) {
      var l = Array.prototype.shift.call(arguments);
      var mt = Array.prototype.shift.call(arguments);
      invoke(l, mt, arguments);
    };

    self.trace = function(messageTemplate) {
      var mt = Array.prototype.shift.call(arguments);
      invoke('TRACE', mt, arguments);
    };

    self.information = function(messageTemplate) {
      var mt = Array.prototype.shift.call(arguments);
      invoke('INFORMATION', mt, arguments);
    };

    self.warning = function(messageTemplate) {
      var mt = Array.prototype.shift.call(arguments);
      invoke('WARNING', mt, arguments);
    };

    self.error = function(messageTemplate) {
      var mt = Array.prototype.shift.call(arguments);
      invoke('ERROR', mt, arguments);
    };

    return self;
  };

  var ConsoleSink = function(options) {
    var self = this;
    options = options || {};

    options.plain = options.plain || (typeof process === 'undefined' || typeof process.stdout === 'undefined');

    var colors = {
      reset: "\x1b[0m",

      style: {
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        underscore: "\x1b[4m"
      },

      foreground: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m"
      },

      background: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m"
      }
    };

    var color = function(fore, back, style) {
      if (options.plain) {
        return function(s) { return s; };
      }

      var cmd = '';

      if (fore) {
        cmd += colors.foreground[fore];
      }
      if (back) {
        cmd += colors.background[back];
      }
      if (style) {
        cmd += colors.style[style];
      }

      return function(s) { return cmd + s + colors.reset; };
    };

    var palettes = {
      'TRACE': {
        foreground: color(null, null, 'bright'),
        property: color(null, null, 'bright')
      },
      'INFORMATION': {
        foreground: color('cyan', null, 'bright'),
        property: color(null, null, 'bright')
      },
      'WARNING': {
        foreground: color('yellow', null, 'bright'),
        property: color(null, null, 'bright')
      },
      'ERROR': {
        foreground: color('red', null, 'bright'),
        property: color(null, null, 'bright')
      }
    };

    var write = {
      log: function() { },
      info: function() { },
      warn: function() { },
      error: function() { }
    };

    if (typeof console === 'object') {
      write.log = function(m, p) { p ? console.log(m, p) : console.log(m); };
      write.info = function(m, p) { p ? console.info(m, p) : console.info(m); };
      write.warn = function(m, p) { p ? console.warn(m, p) : console.warn(m); };
      write.error = function(m, p) { p ? console.error(m, p) : console.error(m); };
    }

    var syntaxError = color('white', 'magenta', 'bright');

    var colorMessage = function(palette, messageTemplate, properties) {
      var result = [];
      for (var i = 0; i < messageTemplate.length; ++i) {
        var token = messageTemplate[i];
        if (typeof token.name === 'string') {
          if (properties.hasOwnProperty(token.name)) {
            var val = properties[token.name];
            if (typeof val === 'undefined') {
              val = 'undefined';
            } else if (val === null) {
              val = 'null';
            }
            result.push(palette.property(val.toString()));
          } else {
            result.push(syntaxError(token.raw));
          }
        } else {
          result.push(token.text);
        }
      }
      return result.join('');
    };

    self.emit = function(evt) {
      var palette = palettes[evt.level] || palette['TRACE'];
      var formatted =
        evt.timestamp.toISOString().replace('T', ' ').replace('Z', '') +
        palette.foreground(' [' + evt.level.slice(0,3) + '] ') +
        colorMessage(palette, evt.messageTemplate, evt.properties);

      if (evt.level === 'ERROR') {
        write.error(formatted, options.complete ? evt.properties : null);
      } else if (evt.level === 'WARNING') {
        write.warn(formatted, options.complete ? evt.properties : null);
      } else if (evt.level === 'INFORMATION') {
        write.info(formatted, options.complete ? evt.properties : null);
      } else {
        write.log(formatted, options.complete ? evt.properties : null);
      }
    };
  };

  var ProcessSink = function(options) {
    var self = this;

    var write = {
      out: function() { },
      err: function() { }
    };

    if (typeof process === 'object' && typeof process.stdout === 'object') {
      var newline = process.platform === 'win32' ? '\r\n' : '\n';
      write.out = function(m) { process.stdout.write(m + newline); };
      write.err = function(m) { process.stderr.write(m + newline); };
    }

    if (typeof options === 'object') {
      if (options.all === 'stderr') {
        write.out = write.err;
      } else if (options.all === 'stdout') {
        write.err = write.out;
      }
    }

    self.emit = function(evt) {
      var formatted = evt.timestamp.toISOString() + ' [' + evt.level + '] ' + evt.renderedMessage();

      if (evt.level === 'ERROR') {
        write.err(formatted);
      } else {
        write.out(formatted);
      }
    };
  };

  var LoggerConfiguration = function() {
    var self = this;

    var minimumLevel = 'INFORMATION';
    var pipeline = [];

    self.pipe = function(element) {
      pipeline.push(element);
      return self;
    };

    self.minimumLevel = function(lvl) {
      if (pipeline.length !== 0) {
        var lm = new LevelMap(lvl);
        return self.filter(function(evt) {
          return lm.isEnabled(evt.level);
        });
      }

      minimumLevel = (lvl || 'INFORMATION').toUpperCase();
      return self;
    };

    self.writeTo = function(sinkOrEmit, onError) {
      if (typeof sinkOrEmit === 'function') {
        return self.writeTo({
          emit: sinkOrEmit
        }, minimumLevel);
      }

      return self.pipe(function(evt, next) {
        try {
          sinkOrEmit.emit(evt);
        } catch (err) {
          if (typeof onError === 'function') {
            onError(err, evt);
          }
        }
        next(evt);
      });
    };

    self.enrich = function(functionOrName, valueOrNull) {
      if (typeof functionOrName === 'string') {
        return self.enrich(function(event){
          event.properties[functionOrName] = valueOrNull;
        });
      }

      return self.pipe(function(evt, next) {
        functionOrName(evt);
        next(evt);
      });
    };

    self.filter = function(filter) {
      return self.pipe(function(evt, next) {
        if(filter(evt)) {
          next(evt);
        }
      });
    };

    self.createLogger = function() {
      var levelMap = new LevelMap(minimumLevel);
      return createLogger(levelMap, pipeline);
    };
  };

  var Serilog = function() {
    var self = this;

    self.sink = {};

    self.sink.console = function(options) {
      return new ConsoleSink(options);
    };

    self.sink.process = function(options) {
      return new ProcessSink(options);
    };

    self.configuration = function() {
      return new LoggerConfiguration();
    };

    self.event = function(level, messageTemplate) {
      var l = Array.prototype.shift.call(arguments);
      var mt = Array.prototype.shift.call(arguments);
      var parsedTemplate = parseMessageTemplate(mt);
      var boundProperties = bindMessageTemplateProperties(parsedTemplate, arguments);
      return new LogEvent(new Date(), l, parsedTemplate, boundProperties);
    };
  };

  if (typeof window === 'undefined') {
    module.exports = new Serilog();
  } else {
    window.serilog = new Serilog();
  }

}(this));
