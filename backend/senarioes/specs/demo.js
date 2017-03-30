(function () {
    'use strict'
    require('shelljs/global');

    var util = require('util');
    var requires = require('./../../requireModule');
    var nodelib = requires.nodelib;

    var runCase_Demo = function () {
        var files = nodelib.fileHelper.getAllFiles(process.cwd(), function (file) {
            nodelib.logger.demoLog(file, 1);
        });
    };

    module.exports = {
        runCase_Demo: runCase_Demo
    };
})();