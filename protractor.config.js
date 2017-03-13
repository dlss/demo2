(function() {
    "use strict";

    var path = require('path');
    var HtmlReporter = require('./senarioes/lib/html-screenshot-reporter');
    var util = require('./senarioes/lib/html-screenshot-reporter/util');

    // In order to workaround the authentication of openpublishing-test repo, hosting team provide us a kind of
    // solution by setting http request header "x-ms-test" to do auth. By default, chrome web-driver doesn't load
    // the existing extensions that you have installed in your PC. But we can explicitly tell web-driver to load the
    // extension from the specified file path.
    //var chromeExtensionPath = opse2e.getChrhChromeExtension();

    module.exports.config = {
        seleniumAddress: 'http://localhost:4444/wd/hub',
        allScriptsTimeout: 300000,

        capabilities: {
            browserName: 'chrome',
            shardTestFiles: true,
            maxInstances: 6, 
            // if the maxInstances is too big, it will cause login failure
            chromeOptions: {
                // Get rid of --ignore-certificate yellow warning
                // args: ['--no-sandbox', '--test-type=browser', '--start-maximized'],
                // Set download path and avoid prompting for download even though
                // this is already the default on Chrome but for completeness
                prefs: {
                    download: {
                        prompt_for_download: false,
                        default_directory: path.resolve('result/e2e/downloads/')
                    }
                }
            },
        },

        framework: 'jasmine2',
        specs: ['senarioes/specs/*.js'],
        baseUrl: '',

        suites: {
            demo: 'senarioes/specs/demo.js',
            pactera: 'senarioes/specs/pactera.js',
            work: 'senarioes/specs/work_ops.js',
        },

        exclude: [
            
        ],

        jasmineNodeOpts: {
            showColors: true,
            defaultTimeoutInterval: 1000 * 60 * 8, //This stands for the limited run time of a 'it' block
            includeStackTrace: true,
        },

        params: {
            skipConsoleError: true,
            tablet: 769,
            desktop: 980,
            widescreen: 1180,
        },

        onPrepare: function() {

            //For non-angular site, it's better to close synchronization flag.
            browser.ignoreSynchronization = true;

            // Add a screenshot reporter and store screenshots to `result/e2e/screenshots`:
            jasmine.getEnv().addReporter(new HtmlReporter({
                baseDirectory: 'result/e2e/screenshots',
                preserveDirectory: true,
                pathBuilder: function (spec, descriptions, results, capabilities) {
                    // use [timestamp]-[spec-description-text hashCode] as the filename of test result.
                    var timestamp = new Date().getTime().toString();
                    var desc = descriptions.join('|');
                    return timestamp + '-' + util.hashCode(desc);
                }
            }));
        }
    };
})();