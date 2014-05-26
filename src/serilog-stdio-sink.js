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
    root.serilog.sink.stdio = factory();
  }
}(this, function() {

  function StdioSink(options) {
    var self = this;
    self.toString = function() { return 'StdioSink'; };

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
  }

  return function(options) { return new StdioSink(options); };
}));
