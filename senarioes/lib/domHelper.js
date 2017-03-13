(function () {
    "use strict";

    var util = require('util');
    var path = require('path');
    var https = require('https');
    var request = require('request');
    var fs = require('fs');
    var reportUtil = require('./html-screenshot-reporter/util');

    //most synchronized API calls will timeout in 30 seconds
    var defaultTimeout = 10 * 1000;
    var UNDEFINED = 'undefined';
    var EC = protractor.ExpectedConditions;

    var safeInputWithNoAngular = function (foundElement, key) {
        browser.driver.wait(function () {
            return foundElement.isDisplayed(function (displayed) {
                return foundElement.isEnabled(function (enabled) {
                    return displayed && enabled;
                });
            });
        }, 60 * 1000, "Waiting for <input> displayed and enabled timed out!");

        foundElement.clear();
        foundElement.sendKeys(key);

        foundElement.getAttribute('value').then(function (text) {
            if (text !== key) {
                common.logS(util.format("Input text failed, expected:'%s', actual:'%s'. Retry once...", key, text));
                foundElement.clear();
                foundElement.sendKeys(key);
            }
        });
    };

    //depends on the busy level of current environment, provide user a chance to extend timeout period.
    var getTimeoutFactor = function () {
        return browser.params.timeoutFactor || 1; // default timeout factor is 1.
    };

    //some async calls like "publish/MRef" need more time to finish
    var longWait = 2 * 60 * 1000 * getTimeoutFactor();

    var waitForElementToDisable = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " disable timed out.";
        browser.wait(function () {
            return ele.isEnabled().then(function (enabled) {
                return !enabled;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementToEnable = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " enable timed out.";
        browser.wait(function () {
            return ele.isEnabled().then(function (enabled) {
                return enabled;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementToEnableById = function (id, maxTimeout, failMsg) {
        waitForElementToEnable(element(by.id(id)), maxTimeout, failMsg);
    };

    var waitForElementToEnableByXpath = function (xpath, maxTimeout, failMsg) {
        waitForElementToEnable(element(by.xpath(xpath)), maxTimeout, failMsg);
    };

    var waitForElementToDisappear = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " disappear timed out.";
        browser.wait(function () {
            return ele.isDisplayed().then(function (displayed) {
                return !displayed;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementToAppear = function (ele, maxTimeout, failMsg) {
        waitForElementToBePresent(ele, maxTimeout, failMsg);
        waitForElementToDisplay(ele, maxTimeout, failMsg);
    };

    var waitForElementToDisplay = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " display timed out.";
        failMsg = failMsg + " View detail: " + JSON.stringify(ele.elementArrayFinder_.locator_);
        browser.wait(function () {
            return ele.isDisplayed().then(function (displayed) {
                return displayed;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementToDisplayById = function (id, maxTimeout, failMsg) {
        waitForElementToDisplay(element(by.id(id)), maxTimeout, failMsg);
    };

    var waitForElementToDisplayByPath = function (xpath, maxTimeout, failMsg) {
        waitForElementToDisplay(element(by.xpath(xpath)), maxTimeout, failMsg);
    };

    var waitForElementToBePresent = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " present timed out.";
        failMsg = failMsg + " View detail: " + JSON.stringify(ele.elementArrayFinder_.locator_);
        browser.wait(function () {
            return ele.isPresent().then(function (present) {
                return present;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementTextToAppear = function (ele, expectText, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " present timed out.";
        waitForElementToAppear(ele, 60 * 1000, 'The element not loaded');

        browser.wait(function () {
            return ele.getText().then(function (text) {

                var result = (text.toLowerCase() == expectText.toLowerCase());
                if (result == false) {
                    browser.refresh();
                    waitForElementToAppear(ele, 60 * 1000, 'The element not loaded');
                }

                return result;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForElementToBePresentAndRetry = function (ele, retryCount, maxTimeout, callback) {
        browser.wait(function () {
            return ele.isPresent().then(function (present) {
                return present;
            })
        }, maxTimeout || defaultTimeout).then(function () { }, function () {
            if (retryCount > 0) {
                retryCount = retryCount - 1;
                callback();
                browser.sleep(maxTimeout || defaultTimeout);
            }
            else {
                throw util.format("Target element is not found for retry count: [%s]", retryCount);
            }
        });;
    };

    var waitForElementToBePresentByXpath = function (xpath, maxTimeout, failMsg) {
        waitForElementToBePresent(element(by.xpath(xpath)), maxTimeout, failMsg);
    };

    var waitForElementToBePresentById = function (id, maxTimeout, failMsg) {
        waitForElementToBePresent(element(by.id(id)), maxTimeout, failMsg);
    };

    var waitForElementNotToBePresent = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " not present timed out.";
        browser.wait(function () {
            return ele.isPresent().then(function (present) {
                return !present;
            });
        }, maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    var waitForJobWithTwoStatus = function (element, failMsg, successMsg) {
        logS('The waiting task started!');
        waitForElementToAppear(element);
        browser.wait(function () {
            return element.getText().then(function (text) {
                return text.indexOf(successMsg) >= 0 || text.indexOf(failMsg) >= 0;
            });
        }, longWait, 'The waiting task did not finish within ' + longWait + 'ms. Maybe still pending.');
        element.getText().then(function (text) {
            if (text.indexOf(successMsg) >= 0) {
                log('The waiting task succeeded!');
            } else {
                throw ('Job message is \"' + text + '\". But expected success message is \"' + successMsg + '\"');
            }
        });
    };

    var waitForElementToBeClickable = function (ele, maxTimeout, failMsg) {
        var defaultMsg = "Wait for " + JSON.stringify(ele.elementArrayFinder_.locator_) + " clickable timed out.";
        browser.wait(EC.elementToBeClickable(ele), maxTimeout || defaultTimeout, failMsg || defaultMsg);
    };

    //wait for element to be presented and then click
    var safeClick = function (ele) {
        waitForElementToBePresent(ele);
        waitForElementToDisplay(ele);
        waitForElementToEnable(ele);
        //waitForElementToBeClickable(ele);
        ele.click();
    };

    var safeClickEle = function (ele) {
        waitForElementToAppear(ele, 30 * 1000);
        waitForElementToEnable(ele);
        waitForElementToBeClickable(ele, 20 * 1000);
        ele.click();
    };

    var addCatchHandler = function (promises, callback) {
        function successFunc(fulfill) {
            // do nothing here
        }

        for (var p in promises) {
            promises[p].then(successFunc, callback);
        }
    };

    // doSomethingFunc: need to receive a callback function as argument
    // **if any step fails, callback will be triggered**
    // recommend use **addCatchHandler** above
    var doSomethingWithRetry = function (doSomethingFunc, retryCount) {
        function retryFunc(reject) {
            if (retryCount > 0) {
                logS(util.format("Retry once! Remaining times: ", retryCount));
                doSomethingWithRetry(doSomethingFunc, retryCount - 1);
            }
            else {
                throw reject;
            }
        }

        if (retryCount === undefined) {
            retryCount = 1;
        }

        doSomethingFunc(retryFunc);
    };

    // doSomethingFunc: a function has no arguments
    // validateFunc: a function that returns a **promise**
    var doSomethingWithValidationAndRetry = function (doSomethingFunc, validateFunc, retryCount, sleepTime, errorMessage) {
        function retryFunc(logMessage) {
            if (retryCount > 0) {
                log(logMessage);
                browser.refresh();
                doSomethingWithValidationAndRetry(doSomethingFunc, validateFunc, retryCount - 1, sleepTime, errorMessage);
            }
            else {
                throw errorMessage;
            }
        }

        if (retryCount === undefined) {
            retryCount = 1;
        };

        sleepTime = sleepTime || 3 * 1000;
        errorMessage = errorMessage || util.format('Validation failed for retry count: [%s] .', retryCount);

        doSomethingFunc();

        browser.sleep(sleepTime);

        if (validateFunc && typeof validateFunc === 'function') {
            validateFunc().then(function (result) {
                if (!result) {
                    retryFunc('Validation failed, retry and re-validate.');
                }
            }, function (reject) {
                log(reject);
                retryFunc('Validation function have exception, retry and re-validate.');
            });
        }
        else {
            throw 'Please input a function as validateFunc parameter';
        }
    };

    var pageNavigateWithValidationAndRetry = function (ele, expectUrl, retryCount, timeout, errorMessage) {
        doSomethingWithValidationAndRetry(
            function () {
                safeClick(ele);
            },
            function () {
                return compareURLs(browser.getCurrentUrl(), expectUrl);
            },
            retryCount || 3, timeout || defaultTimeout,
            errorMessage || 'Your target element is not found');
    }

    var compareURLs = function (promise, expectUrl) {
        return browser.getCurrentUrl().then(function (url) {
            var currentBranch = '?branch=' + browser.params.branchName;
            expectUrl = trimEndSprit(expectUrl);
            url = trimEndSprit(url);
            return expectUrl.toLowerCase() === url.replace(currentBranch, '').toLowerCase();
        });
    }

    var trimEndSprit = function (str) {
        return str.replace(/\/$/, "");
    }

    var safeClickWithRetry = function (ele) {
        doSomethingWithRetry(function (callback) {
            addCatchHandler([
                ele.click()
            ], callback);
        });
    };

    var safeClick_TopLeft = function (ele) {
        waitForElementToBePresent(ele);
        browser.actions().mouseMove(ele, { x: 2, y: 2 }).click().perform();
    };

    var selectDropdownWithRetry = function (dropDownEle, selectEle, retry) {
        function retryFunc(reject) {
            logS("Retry Once!");
            if (retry === true) {
                selectDropdownWithRetry(dropDownEle, selectEle, false);
            }
            else {
                throw reject;
            }
        }

        browser.waitForAngular();
        dropDownEle.click().then(function (fulfill) { }, retryFunc);
        browser.waitForAngular();
        selectEle.click().then(function (fulfill) { }, retryFunc);
    };

    var rightClick = function (itemName) {
        browser.actions().mouseMove(element(by.xpath('//*[text()="' + itemName + '"]'))).perform();
        browser.actions().click(protractor.Button.RIGHT).perform();
    };

    var rightClickElement = function (ele) {
        browser.actions().mouseMove(ele).perform();
        browser.actions().click(protractor.Button.RIGHT).perform();
    };

    var scrollIntoView = function (element) {
        browser.executeScript(function () { arguments[0].scrollIntoView(); }, element.getWebElement());
    };

    var getBrowserWorkingDir = function () {
        if (browser.params.browserWorkingDir) {
            return browser.params.browserWorkingDir;
        }
        return path.resolve(__dirname, "..");
    };

    var selectDropdownbyNum = function (element, optionNum) {
        if (optionNum >= 0) {
            element.all(by.tagName('option')).then(function (options) {
                options[optionNum].click();
            });
        }
    };

    //Set the coorelation Id, so that we could find trace if any error happened in different components
    var setCorrelationId = function (specName) {
        var idPrefix = 'CAPSE2E.' + new Date().getTime().toString() + '.';

        if (specName !== undefined) {
            idPrefix = 'CAPSE2E.' + specName + '.' + new Date().getTime().toString() + '.';
        }

        var injectCode = "AmbientContext.DefaultIdPrefix = '" + idPrefix + "';";

        logS('[Set Prefix for CorrelationId] As "' + idPrefix + '"');

        browser.executeScript(injectCode);
    };

    //click element maybe hidden by other element
    //http://www.blaiseliu.com/protractor-error-element-is-not-clickable-at-point-xx-xx/
    var click = function (element) {
        browser.executeScript('arguments[0].click()', element.getWebElement());
    };

    var verifyXPathListPresent = function (list, shouldPresent, message) {
        for (var n in list) {
            verifyXPathPresent(list[n], shouldPresent, message);
        }
    };

    var verifyXPathPresent = function (xpath, shouldPresent, message) {
        element(by.xpath(xpath)).isPresent().then(function (present) {
            if (present !== shouldPresent) {
                message = message || util.format(
                    'Expect element [%s] to be present [%s], actual is [%s]', xpath, !present, present);
                throw message;
            }
        });
    };

    var resizePage = function (responsive) {
        var width, height;
        switch (responsive) {
            case 'Mobile':
                width = 360;
                height = 480;
                break;
            case 'Tablet':
                width = 640;
                height = 960;
                break;
            default:
                break;
        };
        if (width === null || height === null) {
            return;
        }

        browser.driver.manage().window().setSize(width, height);
    };

    var validationOnDevice = function (callback) {
        var tablet = browser.params.tablet;
        var desktop = browser.params.desktop;
        var widescreen = browser.params.widescreen;

        browser.driver.manage().window().getSize().then(function (eleSize) {
            var deviceType;
            var currentWidth = eleSize.width;

            if (currentWidth <= tablet - 1) {
                deviceType = 'Mobile';
            }
            else if (currentWidth >= tablet) {
                deviceType = 'Tablet';
            }
            else if (currentWidth <= desktop - 1) {
                deviceType = 'Touch';
            }
            else if (currentWidth >= desktop) {
                deviceType = 'Desktop'
            }
            else if (currentWidth >= widescreen) {
                deviceType = 'Widescreen';
            }

            if (callback) {
                callback(deviceType);
            }
        });
    };

    var verifyResponseCode = function (url) {
        https.get(url, (res) => {
            expect(res.statusCode).not.toBe(404);
            expect(res.statusCode).not.toBe(500);
        });
    };

    var verifyResponseCode404 = function (url) {
        https.get(url, function (res) {
            for (var i; i < res.length; i++) {
                if (res[i].statusCode == 404) {
                    expect(res[i].statusCode).toBe(404)
                }
            }

        });
    };

    var verifyLinkIsBroken = function (linkUrl) {
        if (linkUrl.indexOf("http:") > -1) {
            request(linkUrl, function (error, response, body) {
                expect(response.statusCode).not.toBe(404);
                expect(response.statusCode).not.toBe(500);
            });
        }
        else if (linkUrl.indexOf("https:") > -1) {
            https.get(linkUrl, function (res) {
                expect(res.statusCode).not.toBe(404);
                expect(res.statusCode).not.toBe(500);
            });
        }

        browser.sleep(1 * 1000);
    };

    var closeAlert = function () {
        browser.get(browser.baseUrl + 'version').then(function () {
            browser.switchTo().alert().then(
                function (alert) {
                    logS("Navigation error due to alert: " + alert.getText().value_);
                    alert.accept();
                }, function () { });
        });
    };

    var checkBrowserErrorLog = function () {
        if (!browser.params.skipConsoleError || browser.params.skipConsoleError === 'false') {
            browser.manage().logs().get('browser').then(function (browserLog) {
                // when found error logs in browser console, this test method would throw an Error object.
                reportUtil.testBrowserErrorLog(browserLog, 'SEVERE');
            });
        }
    };

    module.exports = {
        //methods
        click: click,
        closeAlert: closeAlert,
        safeClick: safeClick,
        safeClickEle: safeClickEle,
        safeClickWithRetry: safeClickWithRetry,
        selectDropdownWithRetry: selectDropdownWithRetry,
        longWait: longWait,
        UNDEFINED: UNDEFINED,
        rightClick: rightClick,
        rightClickElement: rightClickElement,
        defaultTimeout: defaultTimeout,
        scrollIntoView: scrollIntoView,
        setCorrelationId: setCorrelationId,
        waitForElementToDisable: waitForElementToDisable,
        waitForElementToEnable: waitForElementToEnable,
        waitForElementToEnableById: waitForElementToEnableById,
        waitForElementToEnableByXpath: waitForElementToEnableByXpath,
        waitForElementToAppear: waitForElementToAppear,
        waitForElementToDisappear: waitForElementToDisappear,
        waitForElementToDisplay: waitForElementToDisplay,
        waitForElementToDisplayByPath: waitForElementToDisplayByPath,
        waitForElementToDisplayById: waitForElementToDisplayById,
        waitForElementToBePresent: waitForElementToBePresent,
        waitForElementToBePresentByXpath: waitForElementToBePresentByXpath,
        waitForElementNotToBePresent: waitForElementNotToBePresent,
        waitForElementToBePresentById: waitForElementToBePresentById,
        selectDropdownbyNum: selectDropdownbyNum,
        getBrowserWorkingDir: getBrowserWorkingDir,
        waitForJobWithTwoStatus: waitForJobWithTwoStatus,
        getTimeoutFactor: getTimeoutFactor,
        waitForElementToBeClickable: waitForElementToBeClickable,
        verifyXPathListPresent: verifyXPathListPresent,
        validationOnDevice: validationOnDevice,
        safeClick_TopLeft: safeClick_TopLeft,
        resizePage: resizePage,
        compareURLs: compareURLs,
        checkBrowserErrorLog: checkBrowserErrorLog,
        waitForElementToBePresentAndRetry: waitForElementToBePresentAndRetry,
        addCatchHandler: addCatchHandler,
        doSomethingWithRetry: doSomethingWithRetry,
        doSomethingWithValidationAndRetry: doSomethingWithValidationAndRetry,
        pageNavigateWithValidationAndRetry: pageNavigateWithValidationAndRetry,
        verifyResponseCode: verifyResponseCode,
        verifyResponseCode404: verifyResponseCode404,
        verifyLinkIsBroken: verifyLinkIsBroken,
        waitForElementTextToAppear: waitForElementTextToAppear,
        safeInputWithNoAngular: safeInputWithNoAngular,
    };

})();