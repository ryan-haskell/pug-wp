const gulp = require('gulp')
const del = require('del')
const sass = require('gulp-sass')
const babel = require('gulp-babel')
const series = require('run-sequence')

const paths = {
  del: {
    folders: [ 'public' ]
  },
  styles: {
    src: 'styles/**/*.scss',
    dest: 'public'
  },
  scripts: {
    src: 'scripts/**/*.js',
    dest: 'public/scripts'
  }
}

// Scripts
gulp.task('scripts', () =>
  gulp.src(paths.scripts.src)
    .pipe(babel({ presets: ['env'] }).on('error', console.error))
    .pipe(gulp.dest(paths.scripts.dest))
)

gulp.task('scripts:watch', ['scripts'], () =>
  gulp.watch(paths.scripts.src, ['scripts'])
)

// Styles
gulp.task('styles', () =>
  gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.styles.dest))
)

gulp.task('styles:watch', ['styles'], () =>
  gulp.watch(paths.styles.src, ['styles'])
)

gulp.task('clean', () => del(paths.del.folders))
gulp.task('build', ['styles', 'scripts'])
gulp.task('watch', ['styles:watch', 'scripts:watch'])

gulp.task('dev', (done) => series('clean', 'watch', done))
gulp.task('default', (done) => series('clean', 'build', done))
