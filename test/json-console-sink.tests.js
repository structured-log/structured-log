var serilog = require('../src/core/structured-log.js');
var serilogCompactSink = require('../src/npm/json-console-sink.js');
var assert = require('assert');

describe('JsonConsoleSink', function() {
    var consoleInfoOutput = []
    var originalConsoleInfo = console.info

    beforeEach(function() {
        console.info = function() {
            consoleInfoOutput.push([].slice.call(arguments))
        }
    })

    afterEach(function() {
        console.info = originalConsoleInfo
    })

    it('should output logs to console as JSON', function(done) {
        var log = serilog.configure()
            .writeTo(serilogCompactSink())
            .create()
        
        var messageTemplate = 'Hello, {Name}!'
        var name = 'world'
        
        log.info(messageTemplate, name)
        
        assert(consoleInfoOutput[0][0].messageTemplate.raw === messageTemplate)
        assert(consoleInfoOutput[0][0].properties['Name'] === name)

        done()
    })
})
