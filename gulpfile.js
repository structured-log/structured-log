var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var childProcess = require('child_process');
var concat = require('gulp-concat');

gulp.task('clean-npm', function(){
  return gulp.src('dist/npm', {read: false})
    .pipe(clean());
});

gulp.task('minify-bower-js', [], function(){
  return gulp.src(['src/core/*.js', 'src/bower/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(uglify({mangle: false}))
    .pipe(concat('structured-log.min.js'))
    .pipe(gulp.dest('dist/bower'));
});

gulp.task('copy-bower-js', [], function(){
  return gulp.src(['src/core/*.js', 'src/bower/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(gulp.dest('dist/bower'));
});

gulp.task('copy-bower-json', [], function(){
  return gulp.src(['src/bower/*.json'])
    .pipe(gulp.dest('dist/bower'));
});

gulp.task('copy-bower-readme', [], function(){
  return gulp.src(['README.MD'])
    .pipe(gulp.dest('dist/bower'));
});

gulp.task('build-bower', ['minify-bower-js', 'copy-bower-js', 'copy-bower-json', 'copy-bower-readme']);

gulp.task('copy-npm-js', ['clean-npm'], function(){
  return gulp.src(['src/core/*.js', 'src/npm/*.js', 'src/npm/*.json'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(gulp.dest('dist/npm'));
});

gulp.task('copy-npm-readme', ['clean-npm'], function(){
  return gulp.src(['README.MD'])
    .pipe(gulp.dest('dist/npm'));
});

gulp.task('build-npm', ['copy-npm-js', 'copy-npm-readme']);

gulp.task('build', ['build-bower', 'build-npm']);

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
  var serilog = require('./dist/npm/structured-log.js');
  var terminal = require('./dist/npm/terminal-sink.js');

  var log = serilog.configure()
    .minLevel('TRACE')
    .writeTo(terminal())
    .create();

  log.verbose('This is a verbose message: {really}', true);
  log.debug('This is a debug message');
  log('Length of {string} is {length}', 'hello', 'hello'.length);
  log.warn('This warning is about {@thing}', {dangerLevel: 'high'});
  log.error('Last one!')
});

gulp.task('default', ['smoke']);
