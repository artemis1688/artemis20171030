var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
// var order = require("gulp-order");
// var cleanCSS = require('gulp-clean-css');
var browserSync = require('browser-sync').create();
var autoprefixer = require('autoprefixer');
// var watch = require('gulp-watch');
var mainBowerFiles = require('main-bower-files');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence')

var envOptions = {
    string: 'env',
    default: { env: 'develop' }
}

gulp.task('clean', function() {
    return gulp.src(['./.tmp', './public'], { read: false })
        .pipe($.clean());
});


var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

gulp.task('copyHTML', function() {
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./publick/'))
});

gulp.task('jade', function() {
    // var YOUR_LOCALS = {};
    gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream())
});

gulp.task('sass', function() {
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', '> 5%', 'ie 6'] })
    ];
    return gulp.src('./source/sass/**/*.sass')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //sass編譯完成css
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'production', $.cleanCss()))
        .pipe($.if(options.env === 'production', $.minifyCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream())
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify({
        compress: {
            drop_console: true
        }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles({
            "overrides": {
                "vue": { // 套件名稱
                    "main": "dist/vue.js" // 取用的資料夾路徑
                }
            }
        }))
        .pipe(gulp.dest('./.tmp/vendors'));
    cb(err);
});

// gulp.task('vendorJs', ['bower'], function() {
//     return gulp.src('./.tmp/vendors/**/**.js')
//         .pipe($.concat('vendors.js'))
//         .pipe($.uglify())
//         .pipe(gulp.dest('./public/js'))
// })

gulp.task('vendorJs', ['bower'], function() {
    return gulp.src(['./.tmp/vendors/**/**.js'])
        .pipe($.order([
            'jquery.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendor.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/javascripts'))
})

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        },
        reloadDebounce: 2000
    });
});

gulp.task('image-min', () =>
    gulp.src('./source/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'))
);

gulp.task('watch', function() {
    gulp.watch('./source/sass/**/*.sass', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs'))

gulp.task('default', ['jade', 'sass', 'babel', 'watch', 'browser-sync', 'image-min', 'vendorJs']);