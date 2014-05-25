var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var childProcess = require('child_process');

gulp.task('clean', function(){
  return gulp.src('serilog.min.js', {read: false})
    .pipe(clean());
});

gulp.task('build', ['clean'], function(){
  return gulp.src('src/serilog.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(uglify({mangle: false}))
    .pipe(rename('serilog.min.js'))
    .pipe(gulp.dest('web'));
});

gulp.task('test', ['build'], function(cb) {
  childProcess.exec('mocha --reporter=spec', function(error, stdout, stderr){
    console.log(stdout);
    console.log(stderr);

    if (error) {
      console.log(error);
    }

    cb(error);
  });
});

gulp.task('smoke', ['test'], function() {
  var serilog = require('./web/serilog.min.js');

  var log = serilog.configuration()
    .minimumLevel('TRACE')
    .writeTo(serilog.sink.console())
    .createLogger();

  log.trace('This is a trace message: {really}', true);
  log('Info: length of {string} is {length}', 'hello', 'hello'.length);
  log.warning('This warning is about {@thing}', {dangerLevel: 'high'});
  log.error('Last one!')
});

gulp.task('default', ['smoke']);
