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
    root.serilog.sink.terminal = factory();
  }
}(this, function() {

  function TerminalSink(options) {
    var self = this;

    // options are:
    //   plain -- don't highlight by level or type
    //   complete -- emit all properties after the message
    //   timestamp -- show a timestamp before the message

    self.toString = function() { return 'TerminalSink'; };

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
        foreground: color(null, null, 'bright')
      },
      'INFORMATION': {
        foreground: color('cyan', null, 'bright')
      },
      'WARNING': {
        foreground: color('yellow', null, 'bright')
      },
      'ERROR': {
        foreground: color('red', null, 'bright')
      }
    };

    var write = {
      log: function() { },
      info: function() { },
      warn: function() { },
      error: function() { }
    };

    if (typeof console === 'object') {
      write.log = function(m, p) { if(p) { console.log(m, p); } else { console.log(m); } };
      write.info = function(m, p) { if(p) { console.info(m, p); } else { console.info(m); } };
      write.warn = function(m, p) { if(p) { console.warn(m, p); } else { console.warn(m); } };
      write.error = function(m, p) { if(p) { console.error(m, p); } else { console.error(m); } };
    }

    var syntaxError = color('white', 'magenta', 'bright');
    var keyword = color('blue');
    var date = color('green');
    var structure = color('green');
    var number = color('magenta');
    var text = color('cyan');

    var formatted = function(o) {
      if (typeof o === 'undefined') {
        return keyword('undefined');
      }
      if (o === null) {
        return keyword('null');
      }
      if (typeof o === 'string') {
        return text(o);
      }
      if (typeof o === 'number') {
        return number(o.toString());
      }
      if (typeof o === 'boolean') {
        return keyword(o.toString());
      }
      if (typeof o.toISOString === 'function') {
        return date(o.toISOString());
      }
      if (typeof o === 'object') {
        var s = JSON.stringify(o);
        if (s.length > 70) {
          s = s.slice(0, 67) + '...';
        }
        return structure(s);
      }
      return text(o.toString());
    };

    var bright = color(null, null, 'bright');

    var colorMessage = function(palette, messageTemplate, properties) {
      var tokens = messageTemplate.tokens;

      var result = [];
      for (var i = 0; i < tokens.length; ++i) {
        var token = tokens[i];
        if (typeof token.name === 'string') {
          if (properties.hasOwnProperty(token.name)) {
            var val = properties[token.name];
            var fmt = bright(formatted(val));
            result.push(fmt);
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
      var palette = palettes[evt.level] || palettes.TRACE;
      var formatted = '';
      if (options.timestamp) {
        formatted += evt.timestamp.toISOString().replace('T', ' ').replace('Z', '') + ' ';
      }
      formatted += '[' + palette.foreground(evt.level.slice(0,3).toLowerCase()) + '] ' +
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
  }

  return function(options) { return new TerminalSink(options); };
}));
