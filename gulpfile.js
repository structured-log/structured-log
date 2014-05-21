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
    .pipe(jshint())
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

gulp.task('default', ['build', 'test']);
