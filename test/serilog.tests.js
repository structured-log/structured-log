var serilog = require('../src/serilog.js');

var log = serilog.configuration()
  .writeTo(serilog.sink.console())
  .createLogger();

log.information('Hello, world!');
