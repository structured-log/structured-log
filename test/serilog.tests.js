var serilog = require('../src/serilog.js');

var log = serilog.configuration()
  .minimumLevel('TRACE')
  .enrich(function(event){
    event.properties.isHappy = true;
  })
  .filter(function(event){
    return event.properties.isHappy;
  })
  .writeTo(serilog.sink.console({complete: true}))
  .enrich('machineName', 'BARNEY')
  .filter(serilog.filter.selfLog())
  .writeTo(serilog.sink.process({all: 'stderr'}))
  .createLogger();

log('Quick and easy? {isIt}', true);
log.trace('{prefix}Hello, {name}, this fine {day}!', 'Why, ', 'world', new Date());
log.warning('Warning');
log.error('Uh-oh! {what}', 42);
