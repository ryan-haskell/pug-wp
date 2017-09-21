const gulp = require('gulp')
const del = require('del')
const ts = require('gulp-typescript')
const sass = require('gulp-sass')
const pug = require('gulp-pug')
const series = require('run-sequence')
const path = require('path')

const config = {
  del: {
    folders: [ 'dist' ]
  },
  assets: {
    src: 'src/assets/**/*',
    dest: 'dist/public',
  },
  pug: {
    src: 'src/**/*.pug',
    dest: 'dist'
  },
  sass: {
    src: 'src/styles/**/*.scss',
    dest: 'dist/public'
  },
  typescript: {
    config: 'tsconfig.json',
    src: 'src/**/*.ts',
    dest: 'dist'
  }
}

// ASSETS
gulp.task('assets', () =>
  gulp.src(config.assets.src)
    .pipe(gulp.dest(config.assets.dest))
)

gulp.task('assets:watch', ['assets'], () =>
  gulp.watch(config.assets.src, ['assets'])
)

// PUG
gulp.task('pug', () =>
  gulp.src(config.pug.src)
    .pipe(gulp.dest(config.pug.dest))
)

gulp.task('pug:watch', ['pug'], () =>
  gulp.watch(config.pug.src, ['pug'])
)

// SASS
gulp.task('sass', () =>
  gulp.src(config.sass.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(config.sass.dest))
)

gulp.task('sass:watch', ['sass'], () =>
  gulp.watch(config.sass.src, ['sass'])
)

// TYPESCRIPT
gulp.task('typescript', () =>
  gulp.src(config.typescript.src)
    .pipe(ts.createProject(config.typescript.config)())
    .js
    .pipe(gulp.dest(config.typescript.dest))
)

gulp.task('typescript:watch', ['typescript'], () =>
  gulp.watch(config.typescript.src, ['typescript'])
)

// DEFAULT COMMANDS
gulp.task('clean', () => del(config.del.folders))
gulp.task('build', ['assets', 'pug', 'sass', 'typescript'])
gulp.task('watch', ['assets:watch', 'pug:watch', 'sass:watch', 'typescript:watch'])

gulp.task('dev', (done) => series('clean', 'watch', done))
gulp.task('default', (done) => series('clean', 'build', done))