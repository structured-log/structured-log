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
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.structuredLog = factory();
  }
}(this, function () {

    var expect = require('./expect');
    var async = require('./async');

  function MessageTemplate(messageTemplate) {
    var self = this;

    self.raw = messageTemplate;
    self.tokens = [];

    var ptre = /\{@?\w+}/g;
    var res;
    var textStart = 0;
    while ((res = ptre.exec(messageTemplate)) !== null)
    {
      if (res.index !== textStart) {
        self.tokens.push({text: messageTemplate.slice(textStart, res.index)});
      }

      var destructure = false;

      var tok = res[0].slice(1, -1);
      if (tok.indexOf('@') === 0) {
        tok = tok.slice(1);
        destructure = true;
      }

      self.tokens.push({name: tok, destructure: destructure, raw: res[0]});
      textStart = ptre.lastIndex;
    }

    if (textStart >= 0 && textStart < messageTemplate.length) {
      self.tokens.push({text: messageTemplate.slice(textStart)});
    }
  }

  var capture = function(o, destructure) {
    if (typeof o === 'function') {
      return o.toString();
    }
    if (typeof o === 'object') {
	  // null value will be automatically stringified as "null", in properties it will be as null
	  // otherwise it will throw an error
	  if (o === null)
	    return o;
		
      // Could use instanceof Date, but this way will be kinder
      // to values passed from other contexts...
      if (destructure || typeof o.toISOString === 'function') {
        return o;
      }
      return o.toString();
    }
    return o;
  };

  MessageTemplate.prototype.bindProperties = function(positionalArgs) {
    var self = this;
    var result = {};

    var nextArg = 0;
    for(var i = 0; i < self.tokens.length && nextArg < positionalArgs.length; ++i) {
      var token = self.tokens[i];
      if (typeof token.name === 'string') {
        var p = positionalArgs[nextArg];
        result[token.name] = capture(p, token.destructure);
        nextArg++;
      }
    }

    while (nextArg < positionalArgs.length) {
      var px = positionalArgs[nextArg];
      if (typeof px !== 'undefined') {
        result['a' + nextArg] = capture(px);
      }
      nextArg++;
    }

    return result;
  };

  var toText = function(o) {
    if (typeof o === 'undefined') {
      return 'undefined';
    }
    if (o === null) {
      return 'null';
    }
    if (typeof o === 'string') {
      return o;
    }
    if (typeof o === 'number') {
      return o.toString();
    }
    if (typeof o === 'boolean') {
      return o.toString();
    }
    if (typeof o.toISOString === 'function') {
      return o.toISOString();
    }
    if (typeof o === 'object') {
      var s = JSON.stringify(o);
      if (s.length > 70) {
        s = s.slice(0, 67) + '...';
      }
      return s;
    }
    return o.toString();
  };

  MessageTemplate.prototype.render = function(properties) {
    var self = this;

    var result = [];
    for (var i = 0; i < self.tokens.length; ++i) {
      var token = self.tokens[i];
      if (typeof token.name === 'string') {
        if (properties.hasOwnProperty(token.name)) {
          result.push(toText(properties[token.name]));
        } else {
          result.push(token.raw);
        }
      } else {
        result.push(token.text);
      }
    }
    return result.join('');
  };


  var enrich = function(evts, properties, destructure) {
    evts.forEach(function (evt) {
      for (var prop in properties) {
        if (properties.hasOwnProperty(prop) &&
          !evt.properties.hasOwnProperty(prop)) {
          evt.properties[prop] = capture(properties[prop], destructure);
        }
      }
    });
  };


  var createEvent = function(level, messageTemplate) {
    var l = Array.prototype.shift.call(arguments);
    var mt = Array.prototype.shift.call(arguments);
    var parsedTemplate = new MessageTemplate(mt);
    var boundProperties = parsedTemplate.bindProperties(arguments);
    return new LogEvent(new Date(), l, parsedTemplate, boundProperties);
  };


  function LogEvent(timestamp, level, messageTemplate, properties) {
    var self = this;
    self.timestamp = timestamp;
    self.level = level;
    self.messageTemplate = messageTemplate;
    self.properties = properties;
  }

  LogEvent.prototype.renderedMessage = function() {
    var self = this;
    return self.messageTemplate.render(self.properties);
  };

  var errorLevel = 'ERROR';
  var warnLevel = 'WARN';
  var infoLevel = 'INFO';
  var debugLevel = 'DEBUG';
  var verboseLevel = 'VERBOSE';

  function LevelMap(initial) {
    var self = this;
    self.levels = {};

    if (initial !== 'OFF') {
      var sequence = [errorLevel, warnLevel, infoLevel, debugLevel, verboseLevel];

      var below = false;
      for (var i = 0; i < sequence.length; ++i) {
        var level = sequence[i];
        self.levels[level] = !below;
        if (level === initial) {
          below = true;
        }
      }
    }
  }

  LevelMap.prototype.isEnabled = function(level) {
    var self = this;
    return self.levels[level || 'NONE'] || false;
  };

    //
    // Represents a stage in the pipeline.
    // Each state controls the flow to the next stage.
    // This stage wraps a user-defined sink.
    //
    var SinkStage = function (sinkName, sinkEmit, sinkFlush, sinkClose, onError) {
        expect.string(sinkName);
        expect.func(sinkEmit);
        if (sinkFlush) {
            expect.func(sinkFlush);
        }
        if (sinkClose) {
            expect.func(sinkClose);
        }
        if (onError) {
            expect.func(onError);
        }

        var self = this;
        this.sinkName = sinkName;
        self.sinkEmit = sinkEmit;
        self.sinkFlush = sinkFlush;
        self.sinkClose = sinkClose;
        self.onError = onError;
    };

    //
    // Set the next pipeline stage.
    //
    SinkStage.prototype.setNextStage = function (nextStage) {
        expect.object(nextStage);

        var self = this;
        self.nextStage = nextStage;        
    };

    //
    // Convert an error message or object to string for logging.
    //
    var errToString = function (err) {
        if (typeof(err) === 'string') {
            return err;
        }
        else if (err.stack) {
            return err.stack.toString();
        }
        else {
            return err.toString();
        }
    };

    //
    // Emit log events to the pipeline state.
    // The stage itself controls the flow to the next stage.
    //
    SinkStage.prototype.emit = function (logEvts, done) {
        expect.array(logEvts);
        expect.func(done);

        var self = this;

        //
        // Emit logs to the sink.
        //
        var sinkEmit = function (done) {
            try
            {
                if (self.sinkEmit.length > 1) {
                    // First parameter is async callback.
                    self.sinkEmit(logEvts, done);
                }
                else {
                    // Synchronous flush fn.
                    self.sinkEmit(logEvts);
                    done();
                }
            }
            catch (err) {
                // Emit sink related errors to the next stage.
                if (typeof self.onError === 'function') {
                    self.onError(err, logEvts, done);
                } 
                else if (self.nextStage) {
                    var errLogEvt = createEvent(errorLevel, 'Failed to write to {sink}: {error}', self.sinkName, errToString(err));
                    errLogEvt.properties.isSelfLog = true;
                    self.nextStage.emit([errLogEvt], done);
                }
                else {
                    // There is no next stage.
                    // todo: These errors get lost, need to do something about this!!
                    done();
                }
            }
        };

        //
        // Emit logs to next stage.
        //
        var nextStageEmit = function (done) {
            if (self.nextStage) {
                self.nextStage.emit(logEvts, done);
            }
            else {
                done();
            }           
        };

        async.runParallel(sinkEmit, nextStageEmit, done);
    };

    //
    // Flush the log stage.
    //
    SinkStage.prototype.flush = function (done) {
        expect.func(done);

        var self = this;

        // 
        // Call the sink's flush fn.
        //
        var sinkFlush = function (done) {
            if (!self.sinkFlush) {
                // Sink doesn't have a flush fn.
                done();
            }
            else if (self.sinkFlush.length > 0) {
                // First parameter is async callback.
                self.sinkFlush(done);
            }
            else {
                // Synchronous flush fn.
                self.sinkFlush();
                done();
            }
        };

        //
        // Flush the next stage.
        var nextStageFlush = function (done) {
            if (self.nextStage) {
                self.nextStage.flush(done);
            }
            else {
                done();
            }
        };

        async.runParallel(sinkFlush, nextStageFlush, done);
    };

    //
    // Close the log stage.
    //
    SinkStage.prototype.close = function (done) {
        expect.func(done);

        var self = this;

        //
        // Flush before closing.
        //
        self.flush(function () {

            // 
            // Close the sink.
            //
            var sinkClose = function (done) {
                if (!self.sinkClose) {
                    // Sink doesn't have a close fn.
                    done();
                }
                else if (self.sinkClose.length > 0) {
                    // First parameter is async callback.
                    self.sinkClose(done);
                }
                else {
                    // Synchronous close fn.
                    self.sinkClose();
                    done();
                }
            };

            //
            // Close the next stage.
            //
            var nextStageClose = function (done) {
                if (self.nextStage) {
                    self.nextStage.close(done);
                }
                else {
                    // There is no next stage.
                    done();
                }
            };

            async.runParallel(sinkClose, nextStageClose, done);
        });
    };

    //
    // Represents a stage in the pipeline.
    // Each state controls the flow to the next stage.
    // This stage batches log events until they are flushed through the system.
    //
    var BatchStage = function (config) {
        expect.object(config);

        var self = this;
        self.config = config;
        self.batchedLogEvts = [];
        self.lastFlushTime = (new Date()).getTime();

        //
        // Set default batching values.
        //

        if (!self.config.batchSize) {
            self.config.batchSize = 100;
        }

        if (!self.config.timeDuration) {
            self.config.timeDuration = 1000;
        }
    };

    //
    // Set the next pipeline stage.
    //
    BatchStage.prototype.setNextStage = function (nextStage) {
        expect.object(nextStage);

        var self = this;

        self.nextStage = nextStage;        
    };

    //
    // Flush batched logs to the next stage in the pipeline.
    //
    BatchStage.prototype.flushBatch = function (done) {        
        expect.func(done);

        var self = this;

        // Time to flush logs to the next stage of the pipeline.
        self.nextStage.emit(self.batchedLogEvts, done);
        self.batchedLogEvts = [];
    };

    //
    // Start the flush timer .
    //
    BatchStage.prototype.startFlushTimer = function () {
    
        var self = this;

        self.batchFlushTimer = setTimeout(function () {

                self.flushBatch(function () {}); //todo: don't want empty fn.

            }, self.config.timeDuration);
    };

    //
    // Cancel the flush timer.
    //
    BatchStage.prototype.cancelFlushTimer = function () {

        var self = this;   

        if (self.batchFlushTimer) {
            // Cancel the flush timeout.
            clearTimeout(self.batchFlushTimer);
            self.batchFlushTimer = null;
        }
    };

    //
    // Emit log events to the pipeline state.
    // The stage itself controls the flow to the next stage.
    //
    BatchStage.prototype.emit = function (logEvts, done) { //todo: init timeout.
        expect.array(logEvts);
        expect.func(done);

        var self = this;

        self.cancelFlushTimer();

        var curTime = (new Date()).getTime();

        self.batchedLogEvts = self.batchedLogEvts.concat(logEvts);

        var needsFlushNow = 
            self.batchedLogEvts.length >= self.config.batchSize ||
            self.config.timeDuration && (self.curTime - self.lastFlushTime) > self.config.timeDuration;

        if (needsFlushNow) {
            self.flushBatch(function () {}); //todo: don't want an empty fn here.
        }
        else {
            self.startFlushTimer();

            // Buffered logs, indicate emit is done.
            done();
        }
    };

    //
    // Flush the log stage.
    //
    BatchStage.prototype.flush = function (done) { //todo: reset timeout
        expect.func(done);

        var self = this;

        if (self.batchedLogEvts.length > 0) {
            // Emit batched logs to the next stage.
            self.nextStage.emit(self.batchedLogEvts, function () {
                // Flush the next stage.
                self.nextStage.flush(done);
            });
            self.batchedLogEvts = [];
        }
        else {
            // No logs are batched.
            // Flush the next stage.
            self.nextStage.flush(done);
        }            
    };

    //
    // Close the log stage.
    //
    BatchStage.prototype.close = function (done) {
        expect.func(done);

        var self = this;

        //
        // Flush this stage first.
        //
        self.flush(function () {
            //
            // Close the next stage.
            //
            self.nextStage.close(done);
        })
    };    

    //
    // Represents a filtering stage in the pipeline.
    // Each state controls the flow to the next stage.
    //
    var FilterStage = function (filterPredicate) {
        expect.func(filterPredicate);

        var self = this;
        self.filterPredicate = filterPredicate;
    };

    //
    // Set the next pipeline stage.
    //
    FilterStage.prototype.setNextStage = function (nextStage) {
        expect.object(nextStage);

        var self = this;

        self.nextStage = nextStage;        
    };

    //
    // Emit log events to the pipeline state.
    // The stage itself controls the flow to the next stage.
    //
    FilterStage.prototype.emit = function (logEvts, done) {
        expect.array(logEvts);
        expect.func(done);

        var self = this;
        var filteredLogEvts = logEvts.filter(self.filterPredicate);
        if (filteredLogEvts.length > 0) {
            // Pass filtered logs onto next stage.
            self.nextStage.emit(filteredLogEvts, done);
            return;
        }
    };

    //
    // Flush the log stage.
    //
    FilterStage.prototype.flush = function (done) {
        expect.func(done);

        var self = this;

        // Flush the next stage.
        self.nextStage.flush(done);
    };

    //
    // Close the log stage.
    //
    FilterStage.prototype.close = function (done) {
        expect.func(done);

        var self = this;

        //
        // Flush this stage first.
        //
        self.flush(function () {
            //
            // Close the next stage.
            //
            self.nextStage.close(done);
        });
    };    

    //
    // Represents a stage in the pipeline that adds properties.
    // Each state controls the flow to the next stage.
    //
    var EnrichStage = function (enrichFn, destructure) {
        expect.func(enrichFn);

        var self = this;

        self.enrichFn = enrichFn;
        self.destructure = destructure;
    };

    //
    // Set the next pipeline stage.
    //
    EnrichStage.prototype.setNextStage = function (nextStage) {
        expect.object(nextStage);

        var self = this;

        self.nextStage = nextStage;        
    };

    //
    // Emit log events to the pipeline state.
    // The stage itself controls the flow to the next stage.
    //
    EnrichStage.prototype.emit = function (logEvts, done) {
        expect.array(logEvts);
        expect.func(done);

        var self = this;

        enrich(logEvts, self.enrichFn(), self.destructure);

        // Pass on to next stage.
        self.nextStage.emit(logEvts, done);
    };

    //
    // Flush the log stage.
    //
    EnrichStage.prototype.flush = function (done) {
        expect.func(done);

        var self = this;

        // Flush the next stage.
        self.nextStage.flush(done);
    };

    //
    // Close the log stage.
    //
    EnrichStage.prototype.close = function (done) {
        expect.func(done);

        var self = this;

        //
        // Flush this stage first.
        //
        self.flush(function () {
            //
            // Close the next stage.
            //
            self.nextStage.close(done);
        });
    };    

    //
    // A pipeline stage that passed to another pipeline.
    //
    var SubPipelineStage = function (pipeline) {
        expect.object(pipeline);

        var self = this;
        
        self.pipeline = pipeline;
    };

    //
    // Set the next pipeline stage.
    //
    SubPipelineStage.prototype.setNextStage = function (nextStage) {
        expect.object(nextStage);

        var self = this;

        self.nextStage = nextStage;        
    };

    //
    // Emit log events to the pipeline stage.
    // The stage itself controls the flow to the next stage.
    //
    SubPipelineStage.prototype.emit = function (logEvts, done) {
        expect.array(logEvts);
        expect.func(done);

        var self = this;

        //
        // Emit logs to the next pipeline.
        //
        var pipelineEmit = function (done) {
            self.pipeline.emit(logEvts, done);
        };

        //
        // Emit logs to next stage.
        //
        var nextStageEmit = function (done) {
            if (self.nextStage) {
                self.nextStage.emit(logEvts, done);
            }
            else {
                done();
            }           
        };

        async.runParallel(pipelineEmit, nextStageEmit, done);
    };

    //
    // Flush the log stage.
    //
    SubPipelineStage.prototype.flush = function (done) {
        expect.func(done);

        var self = this;

        // 
        // Call the pipelines's flush fn.
        //
        var pipelineFlush = function (done) {
            self.pipeline.flush(done);
        };

        //
        // Flush the next stage.
        var nextStageFlush = function (done) {
            if (self.nextStage) {
                self.nextStage.flush(done);
            }
            else {
                done();
            }
        };

        async.runParallel(pipelineFlush, nextStageFlush, done);        
    };

    //
    // Close the log stage.
    //
    SubPipelineStage.prototype.close = function (done) {
        expect.func(done);

        var self = this;

        //
        // Flush before closing.
        //
        self.flush(function () {

            // 
            // Close the pipeline.
            //
            var pipelineClose = function (done) {
                self.pipeline.close(done);
            };

            //
            // Close the next stage.
            //
            var nextStageClose = function (done) {
                if (self.nextStage) {
                    self.nextStage.close(done);
                }
                else {
                    // There is no next stage.
                    done();
                }
            };

            async.runParallel(pipelineClose, nextStageClose, done);
        });
    };    


    function Pipeline(pipelineStages) {
        expect.array(pipelineStages);

        if (pipelineStages.length < 1) {
            throw new Error("No pipeline stages defined!");
        }

        var self = this;
        self.pipelineStages = pipelineStages;
        self.headStage = self.pipelineStages[0];

        // 
        // Connect the stages of the pipeline.
        //
        for (var stageIndex = 0; stageIndex < self.pipelineStages.length-1; ++stageIndex) {
            var nextStage = self.pipelineStages[stageIndex+1];
            var stage = self.pipelineStages[stageIndex].setNextStage(nextStage);
        }
    };

    //
    // Emit log events to the pipeline.
    //
    Pipeline.prototype.emit = function (logEvts, done) {
        var self = this;
        self.headStage.emit(logEvts, done);
    };

    // 
    // Flush the pipeline.
    // After completion the queue of batched logs will have been flushed through to all sinks.
    //
    Pipeline.prototype.flush = function (done) {
        var self = this;
        self.headStage.flush(done);
    };

    //
    // Close the pipeline and all sinks.
    //
    Pipeline.prototype.close = function(done) {
        var self = this;
        self.headStage.close(done);
    };

    //
    // Factory function for a logger.
    //
    var createLogger = function(levelMap, pipeline) {
        var self = function() {
            self.info.apply(null, arguments);
        };

        self.toString = function() { return 'Logger'; };

        self.emit = function(logEvts) {
            logEvts = logEvts.filter(function (evt) {
                    return levelMap.isEnabled(evt.level);
                });

            pipeline.emit(logEvts, function () {}); //todo: don't create fn for no reason
        };

        var invoke = function(level, messageTemplate, args) {
            if (!levelMap.isEnabled(level)) {
                return;
            }

            // Template caching opportunity here
            var parsedTemplate = new MessageTemplate(messageTemplate);
            var boundProperties = parsedTemplate.bindProperties(args);

            var evt = new LogEvent(new Date(), level, parsedTemplate, boundProperties);
            pipeline.emit([evt], function () {});  //todo: don't create fn for no reason
        };

        self.verbose = function(messageTemplate) {
            var mt = Array.prototype.shift.call(arguments);
            invoke(verboseLevel, mt, arguments);
        };

        self.debug = function(messageTemplate) {
            var mt = Array.prototype.shift.call(arguments);
            invoke(debugLevel, mt, arguments);
        };

        self.info = function(messageTemplate) {
            var mt = Array.prototype.shift.call(arguments);
            invoke(infoLevel, mt, arguments);
        };

        self.warn = function(messageTemplate) {
            var mt = Array.prototype.shift.call(arguments);
            invoke(warnLevel, mt, arguments);
        };

        self.error = function(messageTemplate) {
            var mt = Array.prototype.shift.call(arguments);
            invoke(errorLevel, mt, arguments);
        };

        self.enrich = function(properties, destructure) {

            var enrichedPipeline = new Pipeline([
                new EnrichStage(function () { return properties; }, destructure),
                new SubPipelineStage(pipeline)
            ]);
            return createLogger(levelMap, enrichedPipeline);
        };

        // 
        // Flush the pipeline.
        // After completion the queue of batched logs will have been flushed through to all sinks.
        //
        self.flush = function (done) {
            pipeline.flush(done);
        };

        //
        // Close (and flush) the logger.
        //
        self.close = function(done) {
            pipeline.close(done);
        };


        return self;
    };


    function LoggerConfiguration() {
        var self = this;

        var minLevel = infoLevel;
        var pipelineStages = [];

        //
        // Add a stage to the pipeline.
        //
        self.addStage = function(pipelineStage) {
            expect.object(pipelineStage);
            
            pipelineStages.push(pipelineStage);
            return self;
        };

        //
        // Specify a minimum log level to output.
        //
        self.minLevel = function(lvl) {
            if (pipelineStages.length !== 0) {
                var lm = new LevelMap(lvl);
                return self.filter(function (evt) {
                    return lm.isEnabled(evt.level);
                });
            }

            minLevel = (lvl || infoLevel).toUpperCase();
            return self;
        };

        //
        // Write log events to a sink.
        //
        self.writeTo = function(sinkOrEmit, onError) {
            if (typeof sinkOrEmit.emit !== 'function' && typeof sinkOrEmit === 'function') {
                return self.writeTo(
                    {
                        emit: sinkOrEmit,
                        toString: function() { 
                            return "function";
                        }
                    },
                    onError
                );
            }

            return self.addStage(new SinkStage(sinkOrEmit.toString(), sinkOrEmit.emit, sinkOrEmit.flush, sinkOrEmit.close, onError));
        };

        self.enrich = function(functionOrProperties, destructure) {
            if (typeof functionOrProperties === 'object') {
                return self.enrich(function (){
                        return functionOrProperties;
                    }, destructure);
            } 
            else if (typeof functionOrProperties === 'function') {
                return self.addStage(new EnrichStage(functionOrProperties, destructure));
            } 
            else {
                throw new Error('Events can be enriched using either a function, or a hash of properties');
            }
        };

        self.filter = function (filter) {
            return self.addStage(new FilterStage(filter));
        };

        //
        // Enable batching for sinks in the pipeline after this function.
        //
        self.batch = function (batchOptions) {
            return self.addStage(new BatchStage(batchOptions || {}));
        };

        //
        // Create a logger from the log configuration.
        //
        self.create = function() {
            return createLogger(new LevelMap(minLevel), new Pipeline(pipelineStages));
        };
    }


  function StructuredLog() {
    var self = this;

    self.sink = {};
    self.filter = {};
    self.enrich = {};

    self.filter.selfLog = function() {
      return function (evts) {
        return evts.filter(function (evt) {
            return evt.properties.isSelfLog;
          });
      };
    };

    self.filter.notSelfLog = function() {
      return function (evts) {
        return evts.filter(function (evt) {
            return !evt.properties.isSelfLog;
          });        
      };
    };

    self.enrich.withStack = function() {
      return function(evts) {
        try {
          //noinspection ExceptionCaughtLocallyJS
          throw new Error('getstack');
        } catch (err) {
          var stack = err.stack;
          if (stack.indexOf('Error: getstack') === 0) {
            stack = stack.slice(stack.indexOf('\n') + 1);
          }
          stack = stack.replace(/^[ ]+/g, '');

          evts.forEach(function (evt) {
            if (!evt.properties.hasOwnProperty('stack')) {
              evt.properties.stack = stack;
            }
          });
        }
      };
    };
  }

  StructuredLog.prototype.configure = function() {
    return new LoggerConfiguration();
  };

  StructuredLog.prototype.event = createEvent;

  return new StructuredLog();
}));
