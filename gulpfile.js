require('shelljs/global');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var clean = require('gulp-clean');

var https = require('https');
var gutil = require('gulp-util');

gulp.argv = require('yargs').argv;

//Clean up task.
gulp.task('clean', function () {
    var dirs = [
        'result'
    ];
    return gulp.src(dirs)
        .pipe(clean({force: true}))
        .on('error', gutil.log);
});

//JS hint task.
gulp.task('jshint', function () {
    var jshintConfig = {
        jshintrc: './.jshintrc',
        sources: [
            './test/**/*.js',
            '!./test/lib/html-screenshot-reporter/*.js'
        ]
    };
    return gulp.src(jshintConfig.sources)
        .pipe(jshint(jshintConfig.jshintrc))
        .pipe(jshint.reporter('default'));
});

//e2e task to wrapper protractor command.
gulp.task('e2e', function (done) {
    var protractorConfigFile = gulp.argv['configFile'] || 'protractor.config.js';
    var cmd = 'protractor "' + protractorConfigFile + '" ';
    cmd += cloneArg(gulp.argv, 'baseUrl');
    cmd += cloneArg(gulp.argv, 'seleniumAddress');
    cmd += cloneArg(gulp.argv, 'specs');
    cmd += cloneArg(gulp.argv, 'exclude');
    cmd += cloneArg(gulp.argv, 'suite');
    cmd += cloneArg(gulp.argv, 'skipConsoleError', 'params.skipConsoleError'); // true by default, it'll show warnings in the reporter; false, it'll show failures in the reporter.
    cmd += cloneArg(gulp.argv, 'branchName', 'params.branchName');
    cmd += cloneArg(gulp.argv, 'maxInstances', 'capabilities.maxInstances'); 

    console.log(cmd);
    var startTime = new Date().getTime().toString();
    var protractorProcess = exec(cmd); // exec is sync code.
    var reporter = require('./utils/reporter');
    var testResultDirectory = 'result/e2e/screenshots';
    mkdir('-p', testResultDirectory);
    // generate test results for those cases that exit unexpectedly.
    if (protractorProcess.code !== 0) {
        var specsFromOptions = [];
        if (gulp.argv['specs']) {
            specsFromOptions = gulp.argv['specs'].split(',');
        }
        if (specsFromOptions.length === 1) {
            reporter.parseSingleInterruptSpec(testResultDirectory, specsFromOptions[0], protractorProcess.output);
        } else {
            reporter.parseInterruptSpecs(testResultDirectory, protractorProcess.output);
        }
    }
    // generate new E2E report.
    var endTime = String(new Date().getTime() + 60000);
    gutil.log('startTime:' + startTime);
    gutil.log('endTime:' + endTime);
    reporter.generateReport(testResultDirectory, startTime, endTime);
    if (protractorProcess.code !== 0) {
        done('Protractor E2E failed.');
    } else {
        gutil.log('Protractor E2E passed.');
        done();
    }
});

//start webdriver.
gulp.task('startSeleniumServer', function () {
    if (checkWebDriverStatus() > 0) {
        var processResult = exec('webdriver-manager start');
        if (processResult.code > 0) {
            gutil.log('Starting Selenium Server failed.');
        } else {
            gutil.log('Selenium Server is started successfully.');
        }
    } else {
        gutil.log('Selenium Server is already started.');
    }
});

//stop webdriver.
gulp.task('stopSeleniumServer', function () {
    if (checkWebDriverStatus() > 0) {
        gutil.log('No active WebDriver server found.');
    } else {
        var processResult = exec('curl -s -L http://localhost:4444/selenium-server/driver?cmd=shutDownSeleniumServer');
        if (processResult.code > 0) {
            gutil.log('Stopping Selenium Server failed.');
        } else {
            logInfo('Selenium Server is stopped successfully.');
        }
    }
});

//check the status of webdriver.
gulp.task('checkSeleniumServerStatus', function () {
    if (checkWebDriverStatus() > 0) {
        gutil.log('Selenium Server is not found.');
    } else {
        gutil.log('Selenium Server is up and running.');
    }
});

//develop environment setup.
gulp.task('EnvSetup', function () {
   exec('PowerShell -executionPolicy bypass ./EnvSetup.ps1');
});

//trigger a build on test repo and check build status.
gulp.task('triggerBuild', function (done) {
    var buildEndpoints = {
        sandbox: 'op-build-sandbox2.azurewebsites.net',
        prod: 'op-build-prod.azurewebsites.net'
    };
    var buildTokens = {
        sandbox: '6f4a0449-cb1b-43a0-9654-4cb3a76ed441',
        prod: 'ddec9070-36a7-4a0b-9358-841e96896f38'
    };
    var testRepoIds = {
        sandbox: 'b2f2f8fa-2d85-651f-c513-3c6c2a7a712f',
        prod: 'b2f2f8fa-2d85-651f-c513-3c6c2a7a712f'
    };
    var buildApiTemplate = '/v1/Repositories/{repoId}/Builds';
    var buildStatusApiTemplate = '/v1/Repositories/{repoId}/Builds/{buildId}';
    var buildEndpoint = gulp.argv['buildEndpoint'] || 'sandbox';
    var buildBranch = gulp.argv['buildBranch'] || 'master';

    var buildApi = applyUrlTemplate(buildApiTemplate, {
        repoId: testRepoIds[buildEndpoint]
    });
    var options = {
        hostname: buildEndpoints[buildEndpoint],
        headers: {
            'accept': 'application/json',
            'X-OP-BuildUserToken': buildTokens[buildEndpoint]
        },
        method: 'POST',
        path: buildApi
    };
    var parameters = {
        branch_name: buildBranch
    };
    var jsonParam = JSON.stringify(parameters);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = jsonParam.length;

    var req = https.request(options, function (res) {
        var data = "";
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            var jsonData = JSON.parse(data);
            if (jsonData.id) {
                gutil.log('The new build id is ' + jsonData.id);
                gutil.log('Start to check build status.');
                var buildStatusApi = applyUrlTemplate(buildStatusApiTemplate, {
                    repoId: testRepoIds[buildEndpoint],
                    buildId: jsonData.id
                });
                checkBuildStatus(buildEndpoints[buildEndpoint], buildStatusApi, buildTokens[buildEndpoint], done);
            } else {
                gutil.log('Trigger build failed.');
                gutil.log('See the error:');
                gutil.log(data);
                done('Trigger build failed!');
            }
        });
    });
    req.write(jsonParam);
    req.on('error', function (e) {
        gutil.log('Trigger build failed.');
        gutil.log('See the error:');
        gutil.log(e);
        done('Trigger build failed.');
    });
    req.end();
});

gulp.task('merge', function (done) {
    var repoName = gulp.argv['repo'];
    var gitUser = gulp.argv['gitUser'];
    var gitToken = gulp.argv['gitToken'];
    var sourceBranch = gulp.argv['sourceBranch'];
    var targetBranch = gulp.argv['targetBranch'];
    if (!repoName || !gitUser || !gitToken || !sourceBranch || !targetBranch) {
        gutil.log('Please provide the correct options for this gulp command:');
        gutil.log('gulp merge --repo xxx --gitUser xxx --gitToken xxx --sourceBranch xxx --targetBranch xxx');
        done('CLI Options is not correct');
    } else {
        var github = require('./utils/github');
        github.cleanPullRequests(repoName, gitUser, gitToken, sourceBranch, targetBranch).then(function () {
            github.merge(repoName, gitUser, gitToken, sourceBranch, targetBranch).then(function (data) {
                gutil.log(data);
                done();
            }, function (error) {
                done('Merge Pull Request failed.');
            });
        }, function (error) {
            done('Clean Pull Request failed.');
        });
    }
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

function checkWebDriverStatus() {
    var processResult = exec('curl http://localhost:4444/wd/hub/status', {silent: true});
    return processResult.code;
}

function applyUrlTemplate (template, valueCollection) {
    var key, url = template;
    for (key in valueCollection) {
        var reg = new RegExp('{' + key + '}', 'g');
        url = url.replace(reg, valueCollection[key]);
    }
    return url;
}

function checkBuildStatus (buildEndpoint, buildApi, buildToken, done) {
    var options = {
        hostname: buildEndpoint,
        headers: {
            'accept': 'application/json',
            'X-OP-BuildUserToken': buildToken
        },
        method: 'GET',
        path: buildApi
    };
    var request = https.request(options, function (res) {
        var data = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var jsonData = JSON.parse(data);
            gutil.log('Current build status:' + jsonData.status);
            /*  Pending = 0,
                Processing = 1,
                Succeeded = 2,
                SucceededWithWarning = 3,
                Failed = 4,
                Cancelled = 5,
            */
            if (jsonData.status === 'Pending' || jsonData.status === 'Processing') {
                setTimeout(function () {
                    checkBuildStatus(buildEndpoint, buildApi, buildToken, done);
                }, 10000);
            } else if (jsonData.status === 'Succeeded' || jsonData.status === 'SucceededWithWarning') {
                done();
            } else {
                done('Final build status is ' + jsonData.status);
            }
        });
    });
    request.on('error', function (e) {
        gutil.log('Check build status failed.');
        gutil.log('See the error:');
        gutil.log(e);
        done('Check build status failed');
    });
    request.end();
}

//default gulp task.
gulp.task('default', ['clean', 'jshint']);
