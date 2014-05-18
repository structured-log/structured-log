var serilog = require('../src/serilog.js');

var log = serilog.configuration()
  .minimumLevel('TRACE')
  .enrich(function(event){
    event.properties.isHappy = true;
  })
  .filter(function(event){
    return event.properties.isHappy;
  })
  .writeTo(serilog.sink.console())
  .enrich('machineName', 'BARNEY')
  .minimumLevel('WARNING')
  .writeTo(serilog.sink.process({all: 'stderr'}))
  .createLogger();

log.information('{prefix}Hello, {name}!', 'Why, ', 'world');
log.warning('This gets more properties and goes to process as well');
