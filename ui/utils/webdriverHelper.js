(function () {
    'use strict';
    require('shelljs/global');

    var path = require('path');
    var gutil = require('gulp-util');
    var childProcess = require('child_process');
    var portfinder = require('portfinder');
    var syncRequest = require('sync-request');
    var _ = require('lodash');

    var WEB_DRIVER_LOG_STARTED = 'Started org.openqa.jetty.jetty.Server'
    var WEB_DRIVER_LOG_STARTED_NEW = 'Selenium Server is up and running';
    var WEB_DRIVER_LOG_STOPPED = 'Command request: shutDownSeleniumServer';
    var scriptExt = /^win/.test(process.platform)?'.cmd':'';

    var getProtractorDir = function() {
        var result = require.resolve("protractor");
        if (result) {
            // result is now something like
            // c:\\Source\\gulp-protractor\\node_modules\\protractor\\lib\\protractor.js
            var protractorDir = path.resolve(path.join(path.dirname(result), "..", "..", ".bin"));
            return protractorDir;
        }
        throw new Error("No protractor installation found.");
    };

    var startSeleniumdriver = function (seleniumPort, verbose, callback) {
        var serverStarted = false;
        var callbackWasCalled = false;

        function _interceptLogData(data) {
            var dataString = data.toString();

            if (!serverStarted && verbose) {
                gutil.log(dataString);
            }

            if (dataString.indexOf(WEB_DRIVER_LOG_STARTED_NEW) >= 0 || dataString.indexOf(WEB_DRIVER_LOG_STARTED) >= 0) {
                gutil.log(dataString);
                gutil.log('[SeleniumServer] - Webdriver standalone server is started');
                callbackWasCalled = true;
                serverStarted = true;
                callback();
            } else if (dataString.indexOf(WEB_DRIVER_LOG_STOPPED) >= 0) {
                if (verbose) {
                    gutil.log(dataString);
                }
            }
        }

        gutil.log('[SeleniumServer] - Webdriver standalone server will be started at http://localhost:' + seleniumPort);
        gutil.log('[SeleniumServer] ' + path.join(getProtractorDir(), 'webdriver-manager' + scriptExt) + ' start --seleniumPort=' + seleniumPort);

        var command = childProcess.spawn(
            path.join(getProtractorDir(), 'webdriver-manager' + scriptExt), 
            ['start', '--seleniumPort=' + seleniumPort]
        );
        
        command.once('close', function (errorCode) {
            gutil.log('[SeleniumServer] - Webdriver standalone server stopped');
            if (!callbackWasCalled) {
                if (!serverStarted) {
                    callback('Webdriver standalone server cannot be started');
                } else {
                    callback(errorCode);
                }
            }
        });

        command.stderr.on('data', _interceptLogData);
        command.stdout.on('data', _interceptLogData)
    };

    var statusSeleniumServer = function (seleniumPort) {
        var statusUrl = 'http://localhost:' + (seleniumPort || 4444) + '/selenium-server/driver?cmd=getLogMessages';
        try {
            var response = syncRequest('GET', statusUrl);
            if (/^[23]/.test('' + response.statusCode)) {
                gutil.log('[SeleniumServer] http://localhost:' + (seleniumPort || 4444) + ' Selenium server is running.');
                return true;
            } else {
                gutil.log('[SeleniumServer] http://localhost:' + (seleniumPort || 4444) + ' Selenium server is not found.');
                return false;
            }
        } catch(e) {
            return false;
        }
    };

    var stopSeleniumServer = function (seleniumPort) {
        if (!statusSeleniumServer(seleniumPort)) {
            return true;
        }
        var stopUrl = 'http://localhost:' + (seleniumPort || 4444) + '/selenium-server/driver?cmd=shutDownSeleniumServer';
        try {
            var response = syncRequest('GET', stopUrl);
            if (/^[23]/.test('' + response.statusCode)) {
                gutil.log('[SeleniumServer] Selenium Server is stopped successfully.');
                return true;
            } else {
                gutil.log('[SeleniumServer][Warning] Stopping Selenium Server failed.');
                return false;
            }
        } catch (e) {
            gutil.log('[SeleniumServer] Netwwork error and cannot stop the specified selenium server.');
            return false;
        }
    };

    var webdriver_update = function(opts, cb) {
        var callback = (cb ? cb : opts);
        var options = (cb ? opts : null);
        var args = ["update", "--standalone"];
        if (options) {
            if (options.browsers) {
                options.browsers.forEach(function(element, index, array) {
                    args.push("--" + element);
                });
            }
        }
        gutil.log('[Webdriver] ' + path.join(getProtractorDir(), 'webdriver-manager'+ scriptExt) + ' ' + _.join(args, ' '));
        childProcess.spawn(
            path.join(getProtractorDir(), 'webdriver-manager'+ scriptExt),
            args, 
            { stdio: 'inherit' }
        ).once('close', callback);
    };

    var builtinProtractor = function (protractorArgs, cwd, callback) {
        portfinder.basePort = 4444; // starting search a free port from 4444.
        portfinder.getPort(function (error, freePort) {
            if (error) {
                gutil.log('[SeleniumServer] Cannot find a free port to host local selenium server.');
                gutil.log('See the error:');
                gutil.log(error);
                callback(error);
            } else {
                gutil.log('[SeleniumServer] Find a free port ' + freePort + ' to host local selenium server.');
                // Start local selenium server
                startSeleniumdriver(freePort, true, function (error) {
                    if (error) {
                        callback(error);
                    } else {
                        var protractorCmd = '"' + path.join(getProtractorDir(), 'protractor' + scriptExt) + '"'
                            + ' ' + protractorArgs
                            + ' --seleniumAddress http://localhost:' + freePort + '/wd/hub';
                        var processOptions = {
                            'stdio': 'inherit',
                            'env': process.env,
                            'cwd': cwd
                        };
                        gutil.log();
                        gutil.log('[Protractor] Starting running protractor command...');
                        gutil.log('[Protractor] ' + protractorCmd);
                        gutil.log();
                        exec(protractorCmd, processOptions, function (code, stdout, stderr) {
                            gutil.log('[Protractor] Protractor command finished.\n');
                            // Stop local selenium server
                            stopSeleniumServer(freePort);
                            callback(null, { code: code, stdout: stdout });
                        });
                    }
                });
            }
        });
    };

    module.exports = {
        startSeleniumdriver: startSeleniumdriver,
        stopSeleniumServer: stopSeleniumServer,
        statusSeleniumServer: statusSeleniumServer,
        updateWebdriver: webdriver_update,
        builtinProtractor: builtinProtractor
    };
})();