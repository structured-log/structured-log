var serilog = require('../src/core/structured-log.js');
var assert = require('assert');

describe('LoggerConfiguration', function() {
  describe('#minLevel()', function() {
    it('should suppress events below minimum level', function() {
      var written = [];
      var log = serilog.configure()
        .minLevel('WARN')
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });            
        })
        .create();
      log('Today is sunnny and clear');

      assert.equal(0, written.length);
    });

    it('should permit events above minimum level', function() {
      var written = [];
      var log = serilog.configure()
        .minLevel('WARN')
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });            
        })
        .create();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
    });

    it('should apply in pipeline order', function() {
      var info = [];
      var errs = [];
      var log = serilog.configure()
        .minLevel('INFO')
        .writeTo(function(evts) { 
          evts.forEach(function (evt) {            
            info.push(evt); 
          });
        })
        .minLevel('ERROR')
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            errs.push(evt);   
          });          
        })
        .create();
      log.warn('Today is stormy');

      assert.equal(1, info.length);
      assert.equal(0, errs.length);
    });
  });

  describe('#writeTo()', function() {
    it('should emit events', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });            
        })
        .create();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('ERROR', written[0].level);
    });

    it('should report failures', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function(){
          throw 'Broken!';
        })
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      log.warn('A timely warning');

      assert.equal(2, written.length);

      assert.equal('ERROR', written[0].level);
      assert(written[0].properties.isSelfLog);
      assert.notEqual(-1, written[0].renderedMessage().indexOf('Broken!'));

      assert.equal('WARN', written[1].level);
      assert(!written[1].properties.isSelfLog);
    });
  });

  describe('#enrich()', function() {
    it('should add simple properties', function(){
      var written = [];
      var log = serilog.configure()
        .enrich({isHappy: true, isSad: false})
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert(written[0].properties.isHappy);
      assert(written[0].properties.isSad === false);
    });

    it('should destructure complex properties', function(){
      var written = [];
      var log = serilog.configure()
        .enrich({user: {name: 'Nick'}}, true)
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt);   
          });          
        })
        .create();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('Nick', written[0].properties.user.name);
    });

    it('should add properties dynamically', function(){
      var written = [];
      var log = serilog.configure()
        .enrich(function() { return { isHappy: true }; })
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert(written[0].properties.isHappy);
    });
  });
});

describe('serilog.event()', function(){
  it('should capture message template parameters', function(){
    var evt = serilog.event('INFO', 'Happy {age}th birthday, {name}!', 30, 'Fred');
    assert.equal(30, evt.properties.age);
    assert.equal('Fred', evt.properties.name);
  });

  it('should render messages', function(){
    var evt = serilog.event('INFO', 'Happy {age}th birthday, {name}!', 30, 'Fred');
    assert.equal('Happy 30th birthday, Fred!', evt.renderedMessage());
  });

  it('should capture extra parameters', function(){
    var evt = serilog.event('INFO', 'Hi, {name}!', 'Fred', 'Smith');
    assert.equal('Smith', evt.properties.a1);
    assert.equal('Fred', evt.properties.name);
  });

  it('should render missing parameters', function(){
    var evt = serilog.event('INFO', 'Happy {age}th birthday, {name}!', 30);
    assert.equal('Happy 30th birthday, {name}!', evt.renderedMessage());
  });

  it('should suppress missing properties', function(){
    var evt = serilog.event('INFO', 'Happy {age}th birthday, {name}!', 30);
    assert(!evt.properties.hasOwnProperty('name'));
  });

  it('should survive duplicate properties', function(){
    var evt = serilog.event('INFO', 'Hi, {name} {name}!', 'Fred', 'Smith');
    assert.equal('Smith', evt.properties.name);
  });

  it('should stringify objects', function(){
    var evt = serilog.event('INFO', 'Hi, {person}!', { name: 'Fred' });
    assert.equal('string', typeof evt.properties.person);
  });

  it('should observe destructuring hints', function(){
    var evt = serilog.event('INFO', 'Hi, {@person}!', { name: 'Fred' });
    assert.equal('object', typeof evt.properties.person);
    assert.equal('Fred', evt.properties.person.name);
  });
});

describe('Logger', function(){
  describe('#enrich()', function(){
    it('should enrich events with all provided values', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      var sub = log.enrich({machine: 'mine', count: 3});
      sub.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('mine', written[0].properties.machine);
      assert.equal(3, written[0].properties.count);
    });

    it('should preserve existing values', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      var sub = log.enrich({machine: 'mine', count: 3});
      sub.error('{machine}', 'your');

      assert.equal(1, written.length);
      assert.equal('your', written[0].properties.machine);
    });

    it('should nest', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      var sub = log.enrich({machine: 'mine'});
      var subsub = sub.enrich({count: 3});
      subsub.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal('mine', written[0].properties.machine);
      assert.equal(3, written[0].properties.count);
    });

    it('should not interfere with the root logger', function(){
      var written = [];
      var log = serilog.configure()
        .writeTo(function (evts) { 
          evts.forEach(function (evt) {
            written.push(evt); 
          });          
        })
        .create();
      log.enrich({machine: 'mine', count: 3});
      log.error('The sky is falling!');

      assert.equal(1, written.length);
      assert.equal(undefined, written[0].properties.machine);
    });
  });

    it('batching by size should suppress log events until the size has been reached', function () {

        var written = [];
        var log = serilog.configure()
            .batch({
                batchSize: 2,
            })
            .writeTo(function (evts) { 
              evts.forEach(function (evt) {
                written.push(evt); 
              });              
            })
            .create();

        var log1 = '1';
        log(log1);

        assert.equal(0, written.length);

        var log2 = '2';
        log(log2);

        assert.equal(2, written.length);
        assert(log1, written[0].message);
        assert(log2, written[1].message);
    });

    it('batching by time should suppress log events until the time has elapsed', function (done) {

        var written = [];
        var log = serilog.configure()
            .batch({
                timeDuration: 100,
            })
            .writeTo(function (evts) { 
              evts.forEach(function (evt) {
                written.push(evt);
              });              
            })
            .create();

        var log1 = '1';
        log(log1);

        assert.equal(0, written.length);

        // Wait for the time out to elapse.
        setTimeout(function () {
    
                try {
                    assert.equal(1, written.length);
                    assert(log1, written[0].message);
                }
                catch (ex)
                {
                    done(ex);
                    return;
                }

                done();
            }, 100);

    });

    it('batching should be flushed on close', function (done) {

        var written = [];
        var log = serilog.configure()
            .batch({
                timeDuration: 100,
            })
            .writeTo(function (evts) { 
              evts.forEach(function (evt) {
                written.push(evt); 
              });              
            })
            .create();

        var log1 = '1';
        log(log1);

        assert.equal(0, written.length);

        log.close(function () {
            assert.equal(1, written.length);
            assert(log1, written[0].message);

            done();
        });
    });    

    it('flush forces batched log through the pipeline', function (done) {

        var written = [];
        var log = serilog.configure()
            .batch({
                timeDuration: 100,
            })
            .writeTo(function (evts) { 
              evts.forEach(function (evt) {
                written.push(evt); 
              });              
            })
            .create();

        var log1 = '1';
        log(log1);

        assert.equal(0, written.length);

        log.flush(function () {
            
            assert.equal(1, written.length);
            assert(log1, written[0].message);

            done();
        });
    });    

    it('running multiple logs thru a single batch should only invoke the sink once', function (done) {

        var sinkInvocations = 0;

        var log = serilog.configure()
            .batch({
                batchSize: 5,
                timeDuration: 100,
            })
            .writeTo(function (evts) { 
              ++sinkInvocations;
            })
            .create();

        log('1');
        log('2');
        log('3');
        log('4');

        assert.equal(0, sinkInvocations);

        log('5');

        assert.equal(1, sinkInvocations);

        // Wait for the time out to elapse.
        setTimeout(function () {

              // Ensure the sink hasn't been invoked again!
              assert.equal(1, sinkInvocations);
              done();
            }, 500);
    });

});