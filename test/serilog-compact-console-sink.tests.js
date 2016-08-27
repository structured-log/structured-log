var serilog = require('../src/core/structured-log.js');
var serilogCompactSink = require('../src/npm/serilog-compact-console-sink.js');
var assert = require('assert');

describe('SerilogCompactConsoleSink', function() {
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
        
        assert(consoleInfoOutput[0][0]['@mt'] === messageTemplate)
        assert(consoleInfoOutput[0][0]['Name'] === name)

        done()
    })
})
