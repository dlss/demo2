(function () {
    'use strict'
    require('shelljs/global');

    var util = require('util');
    var requires = require('./../../requireModule');
    var nodelib = requires.nodelib;
    var moduleName = "demo";

    var runCase_Demo = function () {
        var files = nodelib.fileHelper.getAllFiles(process.cwd(), function (file) {
            nodelib.logger.log(file, 1, moduleName);
        });
    };

    module.exports = {
        runCase_Demo: runCase_Demo
    };
})();