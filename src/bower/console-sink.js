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
    root.structuredLog.sink.console = factory();
  }
}(this, function() {

  function ConsoleSink(options) {
    var self = this;

    // options are:
    //   complete -- emit all properties after the message
    //   timestamp -- show a timestamp before the message

    self.toString = function() { return 'ConsoleSink'; };

    options = options || {};

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

    self.emit = function(evts) {
      evts.forEach(function (evt) {
        var formatted = '';
        if (options.timestamp) {
          formatted += evt.timestamp.toISOString().replace('T', ' ').replace('Z', '') + ' ';
        }
        formatted += '[' + evt.level.slice(0,3) + '] ' +
          evt.messageTemplate.render(evt.properties);

        if (evt.level === 'ERROR') {
          write.error(formatted, options.complete ? evt.properties : null);
        } else if (evt.level === 'WARN') {
          write.warn(formatted, options.complete ? evt.properties : null);
        } else if (evt.level === 'INFO') {
          write.info(formatted, options.complete ? evt.properties : null);
        } else {
          write.log(formatted, options.complete ? evt.properties : null);
        }
      });
    };
  }

  return function(options) { return new ConsoleSink(options); };
}));
