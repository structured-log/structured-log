var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var childProcess = require('child_process');
var concat = require('gulp-concat');

gulp.task('clean', function(){
  return gulp.src('dist', {read: false})
    .pipe(clean());
});

gulp.task('build-bower', ['clean'], function(){
  return gulp.src(['src/core/serilog.js', 'src/bower/serilog-console-sink.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(uglify({mangle: false}))
    .pipe(concat('serilog.min.js'))
    .pipe(gulp.dest('dist/bower'));
});

gulp.task('build-npm', ['clean'], function(){
  return gulp.src(['src/core/serilog.js', 'src/npm/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(gulp.dest('dist/npm'));
});

gulp.task('test', ['build-bower', 'build-npm'], function(cb) {
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
  var serilog = require('./dist/npm/serilog.js');
  var terminal = require('./dist/npm/serilog-terminal-sink.js');

  var log = serilog.configuration()
    .minimumLevel('TRACE')
    .writeTo(terminal())
    .createLogger();

  log.trace('This is a trace message: {really}', true);
  log('Info: length of {string} is {length}', 'hello', 'hello'.length);
  log.warning('This warning is about {@thing}', {dangerLevel: 'high'});
  log.error('Last one!')
});

gulp.task('default', ['smoke']);
