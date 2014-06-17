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
    define(['fs'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('fs'));
  } else {
    root.serilog.sink.file = factory(root.fs);
  }
}(this, function(fs) {

  var newline = process.platform === 'win32' ? '\r\n' : '\n';

  function FileSink(path, options) {
    var self = this;
    var stream = fs.createWriteStream(path, {encoding: 'utf-8', flags: 'a+'});

    self.emit = function(evt) {
      var formatted = evt.timestamp.toISOString() + ' [' + evt.level + '] ' + evt.renderedMessage();
      stream.write(formatted + newline);
    };

    self.end = function(cb) {
      stream.end(null, null, cb);
    };
  }

  return function(path, options) { return new FileSink(path, options); };
}));
