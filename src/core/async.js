'use strict';

var expect = require('./expect');

//
// Run several async functions in parallel, invoke a callback when they are done.
//
var runAsyncParallel = function () {

    var done = arguments[arguments.length-1];
    expect.func(done);

    if (arguments.length <= 1) {
        done();
        return;
    }

    var awaitingCompletion = arguments.length-1;
    var allDone = false;

    //
    // Fire the final callback if all async fns have completed.
    //
    var checkAllDone = function () {
        if (allDone) {
            // Already completed all.
            return;
        }

        --awaitingCompletion;
        if (awaitingCompletion <= 0) {
            allDone = true;
            done();
        }
    };

    for (var i = 0; i < arguments.length-1; ++i) {
        var fn = arguments[i];
        expect.func(fn);

        fn(checkAllDone);
    }
};

module.exports = {
    runParallel: runAsyncParallel,
};