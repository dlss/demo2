(function () {
    'use strict'
    require('shelljs/global');

    var util = require('util');
    var requires = require('./../../requireModule');
    //var config = requires.common.specsConfig(__filename);

    var runCase_Demo = function () {
        var files = requires.fileHelper.getAllFiles(process.cwd(), function (file) {
            requires.logger.demoLog(file, 1);
        });
    };

    module.exports = {
        runCase_Demo: runCase_Demo
    };
})();