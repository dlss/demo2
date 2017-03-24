require('shelljs/global');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var clean = require('gulp-clean');
var _ = require('lodash');
var gutil = require('gulp-util');
var path = require('path');
var webdriverHelper = require('./utils/webdriverHelper');
var reportHelper = require('./utils/reportHelper');
var cons = require('./lib/const');

gulp.argv = require('yargs').argv;

//Clean up task.
gulp.task('clean', function () {
    var dirs = [
        'result',
        'logs'
    ];
    return gulp.src(dirs)
        .pipe(clean({ force: true }))
        .on('error', gutil.log);
});

//Clean up task.
gulp.task('init', function () {
    exec('npm run initGu && npm run initPr && npm install');
});

//e2e task to wrapper protractor command.
gulp.task('e2e', function (done) {
    var workingDirectory = cons.path.workingDirectory;
    var testResultDirectory = cons.path.testResultDirectory;
    var preserveBaseDir = true;
    var protractorConfigFile = gulp.argv['configFile'] || 'protractor.config.js';
    
    if (preserveBaseDir) {
        gutil.log('Clean up e2e test result directory \'' + path.join(workingDirectory, testResultDirectory) + '\' firstly.');
        rm('-rf', path.join(workingDirectory, testResultDirectory));
        gutil.log('Clean up finished.');
    }

    var cmdArgs = ' "' + protractorConfigFile + '" ';
    cmdArgs += cloneArg(gulp.argv, 'baseUrl');
    cmdArgs += cloneArg(gulp.argv, 'specs');
    cmdArgs += cloneArg(gulp.argv, 'exclude');
    cmdArgs += cloneArg(gulp.argv, 'suite');
    cmdArgs += cloneArg(gulp.argv, 'testData', 'params.testData');
    cmdArgs += cloneArg(gulp.argv, 'throwConsoleError', 'params.throwConsoleError');
    cmdArgs += cloneArg(gulp.argv, 'branchName', 'params.branchName');
    cmdArgs += cloneArg(gulp.argv, 'maxInstances', 'capabilities.maxInstances');
    cmdArgs += pushArg('params.reporterBaseDir', amendWindowsPath(testResultDirectory));

    webdriverHelper.builtinProtractor(cmdArgs, workingDirectory, function (error, data) {
        if (error) {
            done(error);
        } else if (data) {
            // protractor process exit code is not 0, scan protractor console log to see if there are unexpectedly interrupted specs.
            if (data.code != 0) {
                generateInterruptSpecReport(path.join(workingDirectory, testResultDirectory), data.stdout);
            }
            reportHelper.generateHTMLReporter(testResultDirectory, testResultDirectory, workingDirectory);
            
            gutil.log('Protractor E2E finished.');
            done();
        } else {
            done();
        }
    });
});

function cloneArg(argv, key, alias) {
    if (argv[key]) {
        if (alias) {
            return ' --' + alias + ' ' + argv[key];
        } else {
            return ' --' + key + ' ' + argv[key];
        }
    }
    return '';
}

function pushArg(key, value) {
    return ' --' + key + ' ' + value;
}

function generateInterruptSpecReport(testResultDirectory, logMsg) {
    mkdir('-p', testResultDirectory);

    var specsFromOptions = [];
    if (gulp.argv['specs']) {
        specsFromOptions = gulp.argv['specs'].split(',');
    }
    if (specsFromOptions.length === 1) {
        reportHelper.parseSingleInterruptSpec(testResultDirectory, specsFromOptions[0], logMsg);
    } else {
        reportHelper.parseInterruptSpecs(testResultDirectory, logMsg);
    }
}

function amendWindowsPath(filePath) {
    if (filePath) {
        filePath = _.replace(filePath, /"/g, "");
        return '"' + filePath + '"';
    } else {
        return filePath;
    }
}

//default gulp task.
gulp.task('default', ['clean', 'init']);
