var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var uglifyJS = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var ftp = require('vinyl-ftp');
var settings = require('./settings');

gulp.task('default', ['browser-sync']);

gulp.task('build', ['cleanCSS', 'uglifyJS', 'htmlmin'], function () {
	console.log('**** build success ****');
});

gulp.task('deploy', function () {
	var ftpConf = settings.ftp;
	var conn = ftp.create({
		host: ftpConf.host,
		user: ftpConf.user,
		password: ftpConf.password
	});

	gulp.src('build/**/*.*', { buffer: false })
			.pipe(conn.dest('htdocs/lock'));
});

gulp.task('browser-sync', function () {
	browserSync.init({
		server: {
			baseDir: 'src'
		}
	});
	gulp.watch("src/*.*").on('change', browserSync.reload);
});

gulp.task('cleanCSS', function () {
	gulp.src('src/*.css')
			.pipe(autoprefixer())
			.pipe(cleanCSS())
			.pipe(gulp.dest('build'));
});

gulp.task('uglifyJS', function () {
	gulp.src('src/*.js')
			.pipe(uglifyJS())
			.pipe(gulp.dest('build'));
});

gulp.task('htmlmin', function () {
	var minOptions = {
		removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeEmptyAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true,
	}

	gulp.src('src/*.html')
			.pipe(htmlmin(minOptions))
			.pipe(gulp.dest('build'));
});
