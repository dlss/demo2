(function () {
    "use strict";

    var util = require('util');
    var path = require('path');

    var arrayContains = function (arr, str) {
        for (var i in arr) {
            if (arr[i] === str) {
                return true;
            }
        }

        return false;
    }

    var trimEndSprit = function (str) {
        return str.replace(/\/$/, "");
    }

    var createRandomNameWithPrefix = function (prefix) {
        return util.format('%s-%s_%s', prefix, new Date().getTime().toString(), Math.floor(Math.random() * 10000));
    };

    // Returns a random integer between min (included) and max (included)
    var getRandomNum = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    var specsConfig = function (fileName) {
        var specName = path.parse(fileName).name;
        return require('./../senarioes/data/' + specName).configs;
    };

    module.exports = {
        arrayContains: arrayContains,
        trimEndSprit: trimEndSprit,
        createRandomNameWithPrefix: createRandomNameWithPrefix,
        getRandomNum: getRandomNum,
        specsConfig: specsConfig,
    };

})();