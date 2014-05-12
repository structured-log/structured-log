(function(){
  var Serilog = function() {
    var self = this;

    self.sink = function(emit) {
      return {
        emit: emit
      };
    };

    self.sink.console = function() {
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

      return self.sink(function(lev) {
        if (lev.level === 'ERROR' || lev.level === 'FATAL') {
          write.err(lev.renderedMessage());
        } else {
          write.out(lev.renderedMessage());
        }
      });
    };

    self.configuration = function() {
      var sinks = [];

      var builder = {};

      builder.writeTo = function(sink) {
        sinks.push(sink);
        return builder;
      };

      builder.createLogger = function() {
        return {
          information: function(messageTemplate) {
            var lev = {
              renderedMessage: function() { return messageTemplate; }
            };
            sinks.forEach(function(sink){
              sink.emit(lev);
            });
          }
        };
      };

      return builder;
    };

  };

  if (typeof window === 'undefined') {
    module.exports = new Serilog();
  } else {
    window.serilog = new Serilog();
  }

}(this));
