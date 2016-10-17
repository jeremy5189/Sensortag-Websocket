var gulp = require('gulp'),
	copy = require('gulp-copy'),
	through = require('through2');

gulp.task('default', function() {
	return gulp.src([
		   		'node_modules/bootstrap/dist/css/**/*.css',
		   		'node_modules/bootstrap/dist/css/**/*.map',
		   		'node_modules/bootstrap/dist/js/**/*.js',
		   		'node_modules/bootstrap/dist/fonts/**/*',
		   		'node_modules/jquery/dist/**/*.js',
		   		'node_modules/jquery/dist/**/*.map',
                'node_modules/sprintf-js/dist/*.min.js',
                'node_modules/sprintf-js/dist/*.min.js.map'
		   ]).pipe(copy('public')).pipe(verify());
})

function verify ()
{
    var options = { objectMode: true };
    return through(options, write, end);

    function write (file, enc, cb)
    {
        console.log('file', file.path);
        cb(null, file);
    }

    function end (cb)
    {
        console.log('done');
        cb();
    }
}