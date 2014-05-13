(function(){
  var LogEvent = function(timestamp, level, messageTemplate, properties) {
    var self = this;

    self.timestamp = timestamp;
    self.level = level;
    self.messageTemplate = messageTemplate;
    self.properties = properties;
    self.renderedMessage = function() { return messageTemplate; };
  };

  var LevelMap = function(initial) {
    var self = this;

    var levels = {};

    if (initial !== 'OFF') {
      var sequence = ['ERROR', 'WARNING', 'INFORMATION', 'TRACE'];

      var below = false;
      for (var i = 0; i < sequence.length; ++i) {
        var level = sequence[i];
        levels[level] = !below;
        if (level === initial) {
          below = true;
        }
      }
    }

    self.isEnabled = function(level) {
      return levels[level || 'NONE'] || false;
    };
  };

  var Logger = function(levelMap, enrichers, filters, sinks) {
    var self = this;

    self.write = function(level, messageTemplate) {
      if (!levelMap.isEnabled(level)) {
        return;
      }

      var event = new LogEvent(new Date(), level, messageTemplate, {});

      for (var i = 0; i < enrichers.length; ++i) {
        enrichers[i](event);
      }

      for (var j = 0; j < filters.length; ++j) {
        if (!(filters[j](event))) {
          return;
        }
      }

      sinks.forEach(function(sink){
        sink.emit(event);
      });
    };

    self.trace = function(messageTemplate) {
      self.write('TRACE', messageTemplate);
    };

    self.information = function(messageTemplate) {
      self.write('INFORMATION', messageTemplate);
    };

    self.warning = function(messageTemplate) {
      write('WARNING', messageTemplate);
    };

    self.error = function(messageTemplate) {
      write('ERROR', messageTemplate);
    };
  };

  var ConsoleSink = function() {
    var self = this;

    // This is really just hacked up for now; we want to
    // properly support structured console.log and friends, colorization, etc.

    var write = {
      out: function(m) { },
      err: function(m) { }
    };

    if (typeof process !== 'undefined' && typeof process.stdout !== 'undefined') {
      write.out = function(m) { process.stdout.write(m); };
      write.err = function(m) { process.stderr.write(m); };
    } else if (typeof console !== 'undefined') {
      write.out = write.err = function(m) { console.log(m) };
    }

    self.emit = function(evt) {
      var formatted = evt.timestamp.toString() + ' [' + evt.level + '] ' +
        evt.renderedMessage() + ' ' + JSON.stringify(evt.properties);

      if (evt.level === 'ERROR') {
        write.err(formatted);
      } else {
        write.out(formatted);
      }
    };
  };

  var LoggerConfiguration = function() {
    var self = this;

    var sinks = [];
    var minimumLevel = 'INFORMATION';
    var filters = [];
    var enrichers = [];

    self.writeTo = function(sink) {
      sinks.push(sink);
      return self;
    };

    self.minimumLevel = function(lvl) {
      minimumLevel = (lvl || 'INFORMATION').toUpperCase();
      return self;
    };

    self.enrich = function(functionOrName, valueOrNull) {
      if (typeof functionOrName === 'string') {
        return self.enrich(function(event){
          event.properties[functionOrName] = valueOrNull;
        });
      }
      enrichers.push(functionOrName);
      return self;
    };

    self.filter = function(filter) {
      filters.push(filter);
      return self;
    };

    self.createLogger = function() {
      var levelMap = new LevelMap(minimumLevel);
      return new Logger(levelMap, enrichers, filters, sinks);
    };
  };

  var Serilog = function() {
    var self = this;

    var wireSink = function(sink, minimumLevel) {
      if (!minimumLevel) {
        return sink;
      }

      var levelMap = new LevelMap(minimumLevel);
      return {
        emit: function(evt){
          if (levelMap.isEnabled(evt.level)) {
            sink.emit(evt);
          }
        }
      };
    };

    self.sink = function(emit, minimumLevel) {
      return wireSink({
        emit: emit
      }, minimumLevel);
    };

    self.sink.console = function(options, minimumLevel) {
      return wireSink(new ConsoleSink(options), minimumLevel);
    };

    self.configuration = function() {
      return new LoggerConfiguration();
    };
  };

  if (typeof window === 'undefined') {
    module.exports = new Serilog();
  } else {
    window.serilog = new Serilog();
  }

}(this));
