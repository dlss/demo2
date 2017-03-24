(function () {
    'use strict';
    require('shelljs/global');

    var fs = require('fs');
    var path = require('path');
    var _ = require('lodash');
    var glob = require('glob');
    var gutil = require('gulp-util');
    var Hashes = require('jshashes');

    function processGlobPatterns(patterns, ignorePatterns, options) {
        var result = [];
        // Iterate over flattened patterns array.
        _.flattenDeep(patterns).forEach((pattern) => {
            // Find all matching files for this pattern.
            const matches = glob.sync(pattern, options);
            // add matching files.
            result = _.union(result, matches);
        });

        // Iterate over flattened patterns array.
        _.flattenDeep(ignorePatterns).forEach((pattern) => {
            // Find all matching files for this pattern.
            const matches = glob.sync(pattern, options);
            // remove matching files.
            result = _.difference(result, matches);
        });

        return result;
    }

    var generateHTMLReporter = function (fromDirectories, toDirectory, cwd) {
        fromDirectories = _.concat([], fromDirectories);
        var totalMetadata = [];
        _.forEach(fromDirectories, function (fromDirectory) {
            var matches = processGlobPatterns(['**/*.json'], ['**/page.css', '**/reporter.html', '**/reporter.json'], {
                cwd: path.join(cwd, fromDirectory),
                nodir: true
            });
            _.forEach(matches, function (relativePath) {
                var fullpath = path.join(cwd, fromDirectory, relativePath);
                try {
                    var json = readJSON(fullpath);
                    totalMetadata.push(json);
                } catch (e) {
                    gutil.log('[WARNING] File \'' + fullpath + '\' is not a valid json file. Will skip it.');
                }
            });
        });

        //copy .json/.png to final test result directory
        mkdir('-p', path.join(cwd, toDirectory));
        _.forEach(fromDirectories, function (fromDirectory) {
            if (path.normalize(fromDirectory) === path.normalize(toDirectory)) {
                // if fromDirectory and toDirectory are the same directory, no need to copy test result.
                return;
            }
            var files = processGlobPatterns(['**/*.png', '**/*.json'], ['**/page.css', '**/reporter.html', '**/reporter.json'], {
                cwd: path.join(cwd, fromDirectory), dot: true
            });
            _.forEach(files, function (src) {
                var fullDest, fullSrc;
                if (process.platform === 'win32') {
                    fullDest = path.join(cwd, toDirectory, src).replace(/\\/g, '/');
                    fullSrc = path.join(cwd, fromDirectory, src).replace(/\\/g, '/');
                } else {
                    fullDest = path.join(cwd, toDirectory, src);
                    fullSrc = path.join(cwd, fromDirectory, src);
                }

                if (fs.existsSync(fullSrc) && fs.statSync(fullSrc).isDirectory()) {
                    mkdir('-p', fullDest);
                } else {
                    cp('-f', fullSrc, fullDest);
                }
            });
        });

        gutil.log('Starting to generate HTML reporter...');
        // generate the merge report into local disk.
        var failingCases = storeE2eReport(totalMetadata, path.join(cwd, toDirectory));
        gutil.log('Generating HTML reporter finished.');

        return !failingCases;
    };

    var storeE2eReport = function (totalMetadata, destDirectory) {
        var categories = [], relationship = {}, tableHTML = '';
        var passCount = 0, warningCount = 0, failCount = 0, interruptCount = 0, loopCount = 0;
        var newCombinedJsonFile = path.join(destDirectory, 'reporter.json');
        var newReportHtmlFile = path.join(destDirectory, 'reporter.html');

        // save combined metadata into reporter.json file.
        gutil.log('Writing combined metadata into \'' + newCombinedJsonFile + '\' file.');
        writeFile(newCombinedJsonFile, JSON.stringify(totalMetadata));
        gutil.log('Write finished.');

        totalMetadata.forEach(function (metadata) {
            var specName = '';
            if (!metadata.interrupted) {
                var descriptions = metadata.description.split('|');
                specName = descriptions[1];
                metadata.description = descriptions[0];
                metadata.browser = metadata.browser ? (metadata.browser.name + ':' + metadata.browser.version) : 'N/A';
                if (metadata.passed && metadata.errorLogs && metadata.errorLogs.length) {
                    warningCount++;
                    metadata.message = 'Warning: Found ' + metadata.errorLogs.length + ' ERROR Logs in browser console.';
                    metadata.trace = formatErrorLog(metadata.errorLogs);
                } else if (metadata.passed) {
                    passCount++;
                    metadata.message = 'passed';
                } else {
                    failCount++;
                }
            } else {
                specName = 'Below are interrupted E2E cases';
                interruptCount++;
            }
            if (!relationship[specName]) {
                categories.push(specName);
                relationship[specName] = [metadata];
            } else {
                relationship[specName].push(metadata);
            }
        });

        // generate test case result info.
        categories.forEach(function (spec) {
            var metadatas = relationship[spec];
            tableHTML += generateTableHTML(spec, metadatas, loopCount);
            loopCount += metadatas.length;
        });

        // generate summary info.
        var summaryHTML = "<div>";
        summaryHTML += "<b>Total tests passed</b>: " + passCount + " <br/> ";
        summaryHTML += "<b>Total tests passedWithWarnings</b>: " + warningCount + " <br/> ";
        summaryHTML += "<b>Total tests failed</b>: " + failCount + " <br/> ";
        summaryHTML += "<b>Total tests interrupted</b>:" + interruptCount + " <br/>";
        summaryHTML += "This report generated on " + new Date() + " </div>";

        gutil.log('Writing test result into \'' + newReportHtmlFile + '\' file.');
        // save test result into reporter.html file.
        var finalHTML = generateHTMLPage(summaryHTML, tableHTML, 'DOCS E2E Test Reporter');
        writeFile(newReportHtmlFile, finalHTML);
        gutil.log('Write finished.');

        gutil.log('---------------------------------------------------');
        gutil.log('Below is the test report summary: ');
        gutil.log('1)Total tests passed: ' + passCount);
        gutil.log('2)Total tests passedWithWarnings: ' + warningCount);
        gutil.log('3)Total tests failed: ' + failCount);
        gutil.log('4)Total tests interrupted: ' + interruptCount);
        gutil.log('Pass Rate: ' + (passCount + warningCount) + '/' + (passCount + warningCount + failCount + interruptCount));
        gutil.log('---------------------------------------------------');
        cp('-R', [path.join(__dirname, 'resources/reporter.css')], destDirectory);

        return failCount + interruptCount;
    };

    var parseInterruptSpecs = function (testResultDirectory, logMessage) {
        var interrupts = getInterruptedSpecs(logMessage);
        interrupts.forEach(function (spec) {
            var baseName = new Date().getTime().toString() + '-' + hashCode(spec.description);
            var filePath = path.join(testResultDirectory, baseName + ".json");
            writeFile(filePath, JSON.stringify(spec));
        });
    };

    var parseSingleInterruptSpec = function (testResultDirectory, specPath, logMessage) {
        var currentSpecResult = {
            "description": "Specs: " + specPath,
            "passed": false,
            "message": "Failed: Exited unexpectedly",
            "trace": logMessage,
            "interrupted": true
        };
        var baseName = new Date().getTime().toString() + '-' + hashCode(currentSpecResult.description);
        var filePath = path.join(testResultDirectory, baseName + ".json");
        writeFile(filePath, JSON.stringify(currentSpecResult));
    };

    var readJSON = function (filePath) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    };

    var readFile = function (filePath) {
        return fs.readFileSync(filePath, 'utf8');
    };

    var writeFile = function (filePath, data) {
        fs.writeFileSync(filePath, data);
    };

    function getSpecPath(logMsg) {
        var index = logMsg.indexOf('Specs');
        return logMsg.substr(index + 7);
    }

    function getRelativePath(fullPath, parentPath) {
        var index = fullPath.indexOf(parentPath);
        if (index >= 0) {
            return fullPath.substr(index + parentPath.length);
        }
        return fullPath;
    }

    function getInterruptedSpecs(logMessage) {
        var pidMatcher = /PID: \d+/i;
        var launcherErrorMatcher = /launcher(\])?(\s-)? Runner process exited unexpectedly with error code: \d+/i;
        var launcherExitMatcher = /launcher(\])?(\s-)? \d+ instance\(s\) of WebDriver still running/i;
        var parentPath = "test\\specs\\";

        var lines = logMessage.split(/\r?\n/);
        var interruptedSpecs = [];
        var currentSpec = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.match(pidMatcher)) {
                currentSpec = [];
            } else if (line.match(launcherExitMatcher)) {
                var len = currentSpec.length;
                if (len > 0 && currentSpec[len - 1].match(launcherErrorMatcher)) {
                    var currentSpecPath = getRelativePath(getSpecPath(currentSpec[0]), parentPath);
                    var currentSpecMessage = currentSpec.join('&#13;&#10;');
                    var currentSpecResult = {
                        "description": "Specs: " + currentSpecPath,
                        "passed": false,
                        "message": "Failed: Exited unexpectedly",
                        "trace": currentSpecMessage,
                        "interrupted": true
                    };
                    interruptedSpecs.push(currentSpecResult);
                }
            } else {
                currentSpec.push(line);
            }
        }
        return interruptedSpecs;
    }

    function makeScriptTag() {
        var scrpTag = "<script type='text/javascript'>";
        scrpTag += "function showTrace(e){";
        scrpTag += "window.event.srcElement.parentElement.getElementsByClassName('traceinfo')[0].className = 'traceinfo visible';}";
        scrpTag += "function closeTraceModal(e){";
        scrpTag += "window.event.srcElement.parentElement.parentElement.className = 'traceinfo';}";
        scrpTag += "function openModal(imageSource){";
        scrpTag += "var myWindow = window.open('','screenshotWindow');";
        scrpTag += "myWindow.document.write('<img src=\"' +imageSource + '\" alt=\"screenshot\" />');}";
        scrpTag += "</script>";
        return scrpTag;
    }

    function generateHTMLPage(summaryHtml, tableHtml, docTitle) {
        var staticHTMLContentprefix = "<html><head><meta charset='utf-8'/>";
        staticHTMLContentprefix += "<title>" + docTitle + "</title>";
        staticHTMLContentprefix += makeScriptTag();
        staticHTMLContentprefix += "<link rel='stylesheet' href='reporter.css'>";

        staticHTMLContentprefix += "</head><body>";
        staticHTMLContentprefix += "<h1>Test Results</h1>";
        staticHTMLContentprefix += summaryHtml;
        staticHTMLContentprefix += "<table class='header'>";
        staticHTMLContentprefix += "<tr><th class='desc-col'>Description</th><th class='status-col'>Passed</th>";
        staticHTMLContentprefix += "<th class='browser-col'>Browser</th>";
        staticHTMLContentprefix += "<th class='os-col'>OS</th>";
        staticHTMLContentprefix += "<th class='msg-col'>Message</th>";
        staticHTMLContentprefix += "<th class='img-col'>Screenshot</th>";
        staticHTMLContentprefix += "<th class='url-col'>URL</th></tr></table>";

        var staticHTMLContentpostfix = "</body></html>";
        var htmlComplete = staticHTMLContentprefix + tableHtml + staticHTMLContentpostfix;

        return htmlComplete;
    }

    function generateTableHTML(specName, metadatas, loopCount) {
        var mainContent = "<div class='category'><div class='category-header'>" + specName + "</div><table><tbody>";
        metadatas.forEach(function (metadata) {
            mainContent += "<tr><td class='desc-col'>" + metadata.description + "</td>";
            if (metadata.passed && metadata.errorLogs && metadata.errorLogs.length) {
                mainContent += "<td class='status-col' style='color:#000;background-color: yellow'>warning</td>";
            } else if (metadata.passed) {
                mainContent += "<td class='status-col' style='color:#fff;background-color: green'>" + metadata.passed + "</td>";
            } else {
                mainContent += "<td class='status-col' style='color:#fff;background-color: red'>" + metadata.passed + "</td>";
            }
            mainContent += "<td class='browser-col'>" + metadata.browser + "</td>";
            mainContent += "<td class='os-col'>" + metadata.os + "</td>";
            var stackTraceInfo = "";
            if ((metadata.passed && metadata.errorLogs && metadata.errorLogs.length) || !metadata.passed) {
                stackTraceInfo = '<br/><a onclick="showTrace()" href="#trace-modal' + loopCount + '">View Stack Trace Info</a><br/> <div id="#trace-modal' + loopCount + '" class="traceinfo"><div><a href="#close" onclick="closeTraceModal()" title="Close" class="close">X</a><pre style="overflow: auto;">' + metadata.trace + '</pre></div></div>';
            }
            mainContent += '<td class="msg-col">' + metadata.message + stackTraceInfo + '</td>';
            mainContent += "<td class='img-col'><a href='#' onclick=\"openModal('" + metadata.screenShotFile + "')\">View</a></td>";
            mainContent += "<td class='url-col'><a href='" + metadata.url + "' target='_blank'>" + metadata.url + "</a></td></tr>";

            loopCount++;
        });
        mainContent += "</tbody></table></div>";

        return mainContent;
    }

    function formatErrorLog(errorLogs) {
        var result = "[";
        errorLogs.forEach(function (error) {
            result += '{"level": ' + error.level + '\n';
            result += '  "message": ' + error.message + '\n';
            result += '  "timestamp: ' + error.timestamp + '\n';
            result += '  "type: ' + error.type + '},\n';
        });
        result += ']';
        return result;
    };

    function hashCode(str) {
        if (typeof str !== 'string') {
            return 0;
        }
        return new Hashes.MD5().hex(str);
    };

    module.exports = {
        generateHTMLReporter: generateHTMLReporter,
        parseInterruptSpecs: parseInterruptSpecs,
        parseSingleInterruptSpec: parseSingleInterruptSpec,
        readJSON: readJSON,
        readFile: readFile,
        writeFile: writeFile
    };
})();
