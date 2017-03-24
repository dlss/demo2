(function () {
    "use strict";

    var util = require('util');
    var common = require('./common');
    var defaultTimeout = 30 * 1000;

    var verifyElementPresent = function (byEle, message) {
        verifyCountGreaterThan(byEle, 0, message);
    };
    
    var verifyElementNoPresent = function (byEle, expectedMeta) {
        element.all(byEle).then(function (elements) {
            if (!elements || elements.length >= 0) {
                return;
            }
            
            throw (util.format('current meta [%s] data should not exist', expectedMeta));
        });
    };

    var verifyCountGreaterThan = function (byEle, count, message) {
        common.waitForElementToBePresentAndRetry(element(byEle), 1, 10 * 1000, function () {
            browser.refresh();
        });

        element.all(byEle).then(function (elements) {
            var actualCount = elements.length;

            if (actualCount <= count) {
                common.log(util.format('%s, expected count grater than %s, the actual is %s', message, count, actualCount));
                throw (util.format('%s, expected count grater than %s, the actual is %s', message, count, actualCount));
            }
        });
    };

    var elementCountByCss = function (css, count, message) {
        this.verifyCountEquals(by.css(css), count, message);
    };

    var verifyCountEquals = function (byEle, count, message) {
        if (count > 0) {
            common.waitForElementToAppear(element(byEle));
        }

        element.all(byEle).then(function (elements) {
            var actualCount = elements.length;

            if (actualCount !== count) {
                common.log(util.format('%s Expected count is %s, actual is %s', message, count, actualCount));
                throw (util.format('%s Expected count is %s, actual is %s', message, count, actualCount));
            }
        });
    };

    module.exports = {
        verifyElementPresent: verifyElementPresent,
        verifyElementNoPresent: verifyElementNoPresent,
        verifyCountGreaterThan: verifyCountGreaterThan,
        verifyCountEquals: verifyCountEquals,
    };

})();