var serilog = require('../src/serilog.js');
var assert = require('assert');

describe('LoggerConfiguration', function() {
  describe('#minimumLevel()', function() {
    it('should suppress events below minimum level', function() {
      var written = [];
      var log = serilog.configuration()
        .minimumLevel('WARNING')
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log('Today is sunnny and clear');

      assert.equal(0, written.length);
    });

    it('should permit events above minimum level', function() {
      var written = [];
      var log = serilog.configuration()
        .minimumLevel('WARNING')
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
    });

    it('should apply in pipeline order', function() {
      var info = [];
      var errs = [];
      var log = serilog.configuration()
        .minimumLevel('INFORMATION')
        .writeTo(function(evt) { info.push(evt); })
        .minimumLevel('ERROR')
        .writeTo(function(evt) { errs.push(evt); })
        .createLogger();
      log.warning('Today is stormy');

      assert.equal(1, info.length);
      assert.equal(0, errs.length);
    });
  });

  describe('#writeTo()', function() {
    it('should emit events', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('ERROR', written[0].level);
    });

    it('should report failures', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(){
          throw 'Broken!';
        })
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.warning('A timely warning');

      assert.equal(2, written.length);

      assert.equal('ERROR', written[0].level);
      assert(written[0].properties.isSelfLog);
      assert.notEqual(-1, written[0].renderedMessage().indexOf('Broken!'));

      assert.equal('WARNING', written[1].level);
      assert(!written[1].properties.isSelfLog);
    });
  });

  describe('#enrich()', function() {
    it('should add simple properties', function(){
      var written = [];
      var log = serilog.configuration()
        .enrich('isHappy', true)
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert(written[0].properties.isHappy);
    });

    it('should add simple properties', function(){
      var written = [];
      var log = serilog.configuration()
        .enrich(function(evt) { evt.properties.isHappy = true; })
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert(written[0].properties.isHappy);
    });
  });
});

describe('serilog.event()', function(){
  it('should capture message template parameters', function(){
    var evt = serilog.event('INFORMATION', 'Happy {age}th birthday, {name}!', 30, 'Fred');
    assert.equal(30, evt.properties.age);
    assert.equal('Fred', evt.properties.name);
  });

  it('should render messages', function(){
    var evt = serilog.event('INFORMATION', 'Happy {age}th birthday, {name}!', 30, 'Fred');
    assert.equal('Happy 30th birthday, Fred!', evt.renderedMessage());
  });

  it('should capture extra parameters', function(){
    var evt = serilog.event('INFORMATION', 'Hi, {name}!', 'Fred', 'Smith');
    assert.equal('Smith', evt.properties.a1);
    assert.equal('Fred', evt.properties.name);
  });

  it('should render missing parameters', function(){
    var evt = serilog.event('INFORMATION', 'Happy {age}th birthday, {name}!', 30);
    assert.equal('Happy 30th birthday, {name}!', evt.renderedMessage());
  });

  it('should suppress missing properties', function(){
    var evt = serilog.event('INFORMATION', 'Happy {age}th birthday, {name}!', 30);
    assert(!evt.properties.hasOwnProperty('name'));
  });

  it('should survive duplicate properties', function(){
    var evt = serilog.event('INFORMATION', 'Hi, {name} {name}!', 'Fred', 'Smith');
    assert.equal('Smith', evt.properties.name);
  });

  it('should stringify objects', function(){
    var evt = serilog.event('INFORMATION', 'Hi, {person}!', { name: 'Fred' });
    assert.equal('string', typeof evt.properties.person);
  });

  it('should observe destructuring hints', function(){
    var evt = serilog.event('INFORMATION', 'Hi, {@person}!', { name: 'Fred' });
    assert.equal('object', typeof evt.properties.person);
    assert.equal('Fred', evt.properties.person.name);
  });
});

describe('Logger', function(){
  describe('#using()', function(){
    it('should enrich events with all provided values', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      var sub = log.using({machine: 'mine', count: 3});
      sub.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('mine', written[0].properties.machine);
      assert.equal(3, written[0].properties.count);
    });

    it('should preserve existing values', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      var sub = log.using({machine: 'mine', count: 3});
      sub.error('{machine}', 'your');

      assert.equal(1, written.length);
      assert.equal('your', written[0].properties.machine);
    });

    it('should nest', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      var sub = log.using({machine: 'mine'});
      var subsub = sub.using({count: 3});
      subsub.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('mine', written[0].properties.machine);
      assert.equal(3, written[0].properties.count);
    });

    it('should not interfere with the root logger', function(){
      var written = [];
      var log = serilog.configuration()
        .writeTo(function(evt) { written.push(evt); })
        .createLogger();
      log.using({machine: 'mine', count: 3});
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal(undefined, written[0].properties.machine);
    });
  });
});