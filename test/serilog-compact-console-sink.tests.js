'use strict'

const serilog = require('../src/core/structured-log.js');
const serilogCompactSink = require('../src/npm/serilog-compact-console-sink.js');
const assert = require('assert');
require('mocha-sinon');

describe('SerilogCompactConsoleSink', function() {
    const consoleInfoOutput = []
    const originalConsoleInfo = console.info

    beforeEach(function() {
        console.info = function() {
            consoleInfoOutput.push([].slice.call(arguments))
        }
    })

    afterEach(() => {
        console.info = originalConsoleInfo
    })

    it('should output logs to console as JSON', (done) => {
        const log = serilog.configure()
            .writeTo(serilogCompactSink())
            .create()
        
        const messageTemplate = 'Hello, {Name}!'
        const name = 'world'
        
        log.info(messageTemplate, name)
        
        assert(consoleInfoOutput[0][0]['@mt'] === messageTemplate)
        assert(consoleInfoOutput[0][0]['Name'] === name)

        done()
    })
})