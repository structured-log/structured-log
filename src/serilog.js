// Copyright 2014 Serilog Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// UMD bolierplate based on https://github.com/umdjs/umd/blob/master/returnExports.js
// Supports node.js, AMD and the browser.
//
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.serilog = factory();
  }
}(this, function () {
  function MessageTemplate(messageTemplate) {
    var self = this;

    self.raw = messageTemplate;
    self.tokens = [];

    var ptre = /\{@?\w+}/g;
    var res;
    var textStart = 0;
    while ((res = ptre.exec(messageTemplate)) !== null)
    {
      if (res.index !== textStart) {
        self.tokens.push({text: messageTemplate.slice(textStart, res.index)});
      }

      var destructure = false;

      var tok = res[0].slice(1, -1);
      if (tok.indexOf('@') === 0) {
        tok = tok.slice(1);
        destructure = true;
      }

      self.tokens.push({name: tok, destructure: destructure, raw: res[0]});
      textStart = ptre.lastIndex;
    }

    if (textStart >= 0 && textStart < messageTemplate.length) {
      self.tokens.push({text: messageTemplate.slice(textStart)});
    }
  }

  var capture = function(o, destructure) {
    if (typeof o === 'function') {
      return o.toString();
    }
    if (typeof o === 'object') {
      // Could use instanceof Date, but this way will be kinder
      // to values passed from other contexts...
      if (destructure || typeof o.toISOString === 'function') {
        return o;
      }
      return o.toString();
    }
    return o;
  };

  MessageTemplate.prototype.bindProperties = function(positionalArgs) {
    var self = this;
    var result = {};

    var nextArg = 0;
    for(var i = 0; i < self.tokens.length && nextArg < positionalArgs.length; ++i) {
      var token = self.tokens[i];
      if (typeof token.name === 'string') {
        var p = positionalArgs[nextArg];
        result[token.name] = capture(p, token.destructure);
        nextArg++;
      }
    }

    while (nextArg < positionalArgs.length) {
      var px = positionalArgs[nextArg];
      if (typeof px !== 'undefined') {
        result['a' + nextArg] = capture(px);
      }
      nextArg++;
    }

    return result;
  };

  var toText = function(o) {
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
      var s = JSON.stringify(o);
      if (s.length > 70) {
        s = s.slice(0, 67) + '...';
      }
      return s;
    }
    return o.toString();
  };

  MessageTemplate.prototype.render = function(properties) {
    var self = this;

    var result = [];
    for (var i = 0; i < self.tokens.length; ++i) {
      var token = self.tokens[i];
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
  };


  var createEvent = function(level, messageTemplate) {
    var l = Array.prototype.shift.call(arguments);
    var mt = Array.prototype.shift.call(arguments);
    var parsedTemplate = new MessageTemplate(mt);
    var boundProperties = parsedTemplate.bindProperties(arguments);
    return new LogEvent(new Date(), l, parsedTemplate, boundProperties);
  };


  function LogEvent(timestamp, level, messageTemplate, properties) {
    var self = this;
    self.timestamp = timestamp;
    self.level = level;
    self.messageTemplate = messageTemplate;
    self.properties = properties;
  }

  LogEvent.prototype.renderedMessage = function() {
    var self = this;
    return self.messageTemplate.render(self.properties);
  };


  function LevelMap(initial) {
    var self = this;
    self.levels = {};

    if (initial !== 'OFF') {
      var sequence = ['ERROR', 'WARNING', 'INFORMATION', 'TRACE'];

      var below = false;
      for (var i = 0; i < sequence.length; ++i) {
        var level = sequence[i];
        self.levels[level] = !below;
        if (level === initial) {
          below = true;
        }
      }
    }
  }

  LevelMap.prototype.isEnabled = function(level) {
    var self = this;
    return self.levels[level || 'NONE'] || false;
  };


  function Pipeline(elements) {
    var self = this;
    self.elements = elements;

    var head = function(evt) { };
    var makeHead = function(el) {
      var oldHead = head;
      return function(evt) { el(evt, oldHead); };
    };

    for (var i = self.elements.length - 1; i >= 0; --i) {
      var el = self.elements[i];
      head = makeHead(el);
    }
    self.head = head;
  }

  Pipeline.prototype.execute = function(evt) {
    var self = this;
    self.head(evt);
  };


  var createLogger = function(levelMap, pipeline) {
    var self = function() {
      self.information.apply(null, arguments);
    };

    self.toString = function() { return 'Logger'; };

    self.emit = function(evt) {
      if (!levelMap.isEnabled(evt.level)) {
        return;
      }
      pipeline.execute(evt);
    };

    var invoke = function(level, messageTemplate, args) {
      if (!levelMap.isEnabled(level)) {
        return;
      }

      // Template caching opportunity here
      var parsedTemplate = new MessageTemplate(messageTemplate);
      var boundProperties = parsedTemplate.bindProperties(args);

      var evt = new LogEvent(new Date(), level, parsedTemplate, boundProperties);

      pipeline.execute(evt);
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

    self.using = function(properties, destructure){
      var enriched = new Pipeline([
        function(evt, next){
          for (var prop in properties) {
            if (properties.hasOwnProperty(prop) &&
                !evt.properties.hasOwnProperty(prop)) {
              evt.properties[prop] = capture(properties[prop], destructure);
            }
          }
          pipeline.execute(evt);
          next(evt);
        }
      ]);
      return createLogger(levelMap, enriched);
    };

    return self;
  };


  function LoggerConfiguration() {
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
      if (typeof sinkOrEmit.emit !== 'function' && typeof sinkOrEmit === 'function') {
        return self.writeTo({
          emit: sinkOrEmit,
          toString: function() { return sinkOrEmit.toString(); }
        }, minimumLevel);
      }

      return self.pipe(function(evt, next) {
        try {
          sinkOrEmit.emit(evt);
        } catch (err) {
          if (typeof onError === 'function') {
            onError(err, evt, next);
          } else if (!evt.properties.isSelfLog) {
            var notification = createEvent('ERROR', 'Failed to write event {@event} to sink {sink}: {error}', evt, sinkOrEmit, err);
            notification.properties.isSelfLog = true;
            next(notification);
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
      return createLogger(levelMap, new Pipeline(pipeline));
    };
  }


  function Serilog() {
    var self = this;

    self.sink = {};
    self.filter = {};

    self.filter.selfLog = function() {
      return function(evt) {
        return evt.properties.isSelfLog;
      };
    };

    self.filter.notSelfLog = function() {
      return function(evt) {
        return !evt.properties.isSelfLog;
      };
    };
  }

  Serilog.prototype.configuration = function() {
    return new LoggerConfiguration();
  };

  Serilog.prototype.event = createEvent;

  return new Serilog();
}));
