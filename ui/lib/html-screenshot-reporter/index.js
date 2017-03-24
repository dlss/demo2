var util = require('./util'),
    mkdirp = require('mkdirp'),
    _ = require('lodash'),
    path = require('path'),
    fs = require('fs');

/** Function: defaultPathBuilder
 * This function builds paths for a screenshot file. It is appended to the
 * constructors base directory and gets prependend with `.png` or `.json` when
 * storing a screenshot or JSON meta data file.
 *
 * Parameters:
 *     (Object) spec - The spec currently reported
 *     (Array) descriptions - The specs and their parent suites descriptions
 *     (Object) result - The result object of the current test spec.
 *     (Object) capabilities - WebDrivers capabilities object containing
 *                             in-depth information about the Selenium node
 *                             which executed the test case.
 *
 * Returns:
 *     (String) containing the built path
 */
function defaultPathBuilder(spec, descriptions, results, capabilities) {
    return util.generateGuid();
}

/** Function: defaultMetaDataBuilder
 * Uses passed information to generate a meta data object which can be saved
 * along with a screenshot.
 * You do not have to add the screenshots file path since this will be appended
 * automatially.
 *
 * Parameters:
 *     (Object) spec - The spec currently reported
 *     (Array) descriptions - The specs and their parent suites descriptions
 *     (Object) result - The result object of the current test spec.
 *     (Object) capabilities - WebDrivers capabilities object containing
 *                             in-depth information about the Selenium node
 *                             which executed the test case.
 *
 * Returns:
 *     (Object) containig meta data to store along with a screenshot
 */
function defaultMetaDataBuilder(spec, descriptions, results, capabilities) {
    var passed = spec.passedExpectations
		, failed = spec.failedExpectations;

    // improve the compatibility because capabilities are different between protractor 2.x and protractor 3.x
    var platform, browserName, version;
    if (capabilities.caps_) {
        platform = capabilities.caps_.platform;
        browserName = capabilities.caps_.browserName;
        version = capabilities.caps_.version;
    }
    else {
        platform = capabilities.get('platform');
        browserName = capabilities.get('browserName');
        version = capabilities.get('version');
    }

    var metaData = {
        description: descriptions.join(' | '),
        passed: _.every(passed.concat(failed), function (it) { return it.passed }),
        status: spec.status, //"passed", "pending", "failed"
        run_duration: spec.endTimeUTC - spec.startTimeUTC,
        os: platform,
        browser: {
            name: browserName,
            version: version
        }
    };

    if (passed.length > 0 || failed.length > 0) {
        var result = passed[0];

        if (failed.length > 0) {
            // pluck method is removed by lodash 4.0.
            var messages = _.map(failed, 'message'),
			      stacks = _.map(failed, 'stack');

            //report all failures
            metaData.message = messages.length && messages.join('\n') || 'Failed';
            metaData.trace = stacks.length && stacks.join('\n') || 'No Stack trace information';

        } else {
            metaData.message = result && result.message || 'Passed';
            metaData.trace = result && result.stack;
        }
    }
    
    if(spec.status === "pending"){
        metaData.message = 'Skipped';
    }

    return metaData;
}

/** Class: ScreenshotReporter
 * Creates a new screenshot reporter using the given `options` object.
 *
 * For more information, please look at the README.md file.
 *
 * Parameters:
 *     (Object) options - Object with options as described below.
 *
 * Possible options:
 *     (String) baseDirectory - The path to the directory where screenshots are
 *                              stored. If not existing, it gets created.
 *                              Mandatory.
 *     (Function) pathBuilder - A function which returns a path for a screenshot
 *                              to be stored. Optional.
 *     (Function) metaDataBuilder - Function which returns an object literal
 *                                  containing meta data to store along with
 *                                  the screenshot. Optional.
 *     (Boolean) takeScreenShotsForSkippedSpecs - Do you want to capture a
 *                                                screenshot for a skipped spec?
 *                                                Optional (default: false).
 */
function ScreenshotReporter(options) {
    options = options || {};
    if (!options.baseDirectory || options.baseDirectory.length === 0) {
        throw new Error('Please pass a valid base directory to store the ' +
			'screenshots into.');
    } else {
        this.baseDirectory = options.baseDirectory;
    }

    if (typeof (options.cssOverrideFile) !== 'undefined' && _.isString(options.cssOverrideFile)) {
        this.cssOverrideFile = options.cssOverrideFile;
    } else {
        this.cssOverrideFile = null;
    }

    this.pathBuilder = options.pathBuilder || defaultPathBuilder;
    this.docTitle = options.docTitle || 'Generated test report';
    this.docName = options.docName || 'report.html';
    this.metaDataBuilder = options.metaDataBuilder || defaultMetaDataBuilder;
    this.preserveDirectory = options.preserveDirectory || false;
    this.takeScreenShotsForSkippedSpecs =
		options.takeScreenShotsForSkippedSpecs || false;
    this.takeScreenShotsOnlyForFailedSpecs =
    options.takeScreenShotsOnlyForFailedSpecs || false;
    this.finalOptions = {
        takeScreenShotsOnlyForFailedSpecs: this.takeScreenShotsOnlyForFailedSpecs,
        takeScreenShotsForSkippedSpecs: this.takeScreenShotsForSkippedSpecs,
        metaDataBuilder: this.metaDataBuilder,
        pathBuilder: this.pathBuilder,
        baseDirectory: this.baseDirectory,
        docTitle: this.docTitle,
        docName: this.docName,
        cssOverrideFile: this.cssOverrideFile
    };

    if (!this.preserveDirectory) {
        util.removeDirectory(this.finalOptions.baseDirectory);
    }
}

var currentSuite, currentSpec;
ScreenshotReporter.prototype.jasmineStarted = function () {
    //console.log("##test[progressStart 'Running Jasmine Tests']");
};

ScreenshotReporter.prototype.jasmineDone = function () {
    //console.log("##test[progressFinish 'Running Jasmine Tests']");
};

ScreenshotReporter.prototype.suiteStarted = function (suite) {
    currentSuite = suite;
    //console.log("##START[testSuiteStarted name='" + (suite.fullName) + "']");
};

ScreenshotReporter.prototype.suiteDone = function (suite) {
    //console.log("##test[testSuiteFinished name='" + (suite.fullName) + "']");
};

ScreenshotReporter.prototype.specStarted = function (spec) {
    currentSpec = spec;
    spec.startTimeUTC =  new Date().getTime();
    //console.log("##START[testStarted name='" + (spec.description) + "' captureStandardOutput='true']");
};

ScreenshotReporter.prototype.specDone = function (spec) {
    spec.endTimeUTC =  new Date().getTime();
    //console.log("##test[testFinished name='" + (spec.description) + "']");

    /** Function: specDone
     * Called by Jasmine when a test spec is done. It triggers the
     * whole screenshot capture process and stores any relevant information.
     *
     * Parameters:
     *     (Object) spec - The test spec to report.
     */

    var self = this, results = spec;
    if (!self.takeScreenShotsForSkippedSpecs && results.skipped) {
        return;
    }

    // In order to avoid missing test result in reporter, take two steps to generate the test result.
    // P1: Generate basic spec result into a metadata json file.
    // P2: Generate browser URL, screenshot, browser capabilities info.
    var defaultCapabilities = {
        caps_: {
            platform: 'Unknown',
            browserName: 'Unknown',
            version: 'Unknown'
        }
    };
    var descriptions = util.gatherDescriptions(currentSuite, [spec.description]),
        baseName = self.pathBuilder(spec, descriptions, results);
    var metaFile = baseName + '.json',
        metaDataPath = path.join(self.baseDirectory, metaFile),
        // pathBuilder can return a subfoldered path too. So extract the
        // directory path without the baseName
        directory = path.dirname(metaDataPath);

    // P1: Generate basic test result info.
    var metaData = self.metaDataBuilder(spec, descriptions, results, defaultCapabilities);
    var testResultMessage = metaData.message;
    if (!metaData.passed && /^Failed:\s\[Browser_ERROR_LOGS\]/.test(metaData.message || '')) {
        // Simplify the test result message. Only show error logs number in test result message and leave the detailed log info in stacktrace.
        testResultMessage = metaData.message.substring(0, metaData.message.indexOf('$$')) || testResultMessage;
        metaData.message = testResultMessage;
    }
    
    if (!fs.existsSync(directory)) {
        mkdirp.sync(directory);
    }
    util.storeMetaData(metaData, metaDataPath);

    // P2: Generate browser url, screenshot, browser capabilities info.
    browser.driver.getCurrentUrl().then(function (currentUrl) {
        browser.takeScreenshot().then(function (png) {
            browser.getCapabilities().then(function (capabilities) {
                browser.manage().logs().get('browser').then(function (browserLog) {
                    var screenShotFile = baseName + '.png';
                    var screenShotPath = path.join(self.baseDirectory, screenShotFile);
                    metaData = self.metaDataBuilder(spec, descriptions, results, capabilities);
                    metaData.screenShotFile = screenShotFile;
                    metaData.url = currentUrl;
                    metaData.message = testResultMessage;
                    metaData.errorLogs = util.collectBrowserLog(browserLog, 'SEVERE');

                    if (!(self.takeScreenShotsOnlyForFailedSpecs && results.status === 'passed')) {
                        util.storeScreenShot(png, screenShotPath);
                    }
                    util.storeMetaData(metaData, metaDataPath);
                });
            });
        });
    });
};

module.exports = ScreenshotReporter;



