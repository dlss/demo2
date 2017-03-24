// extFile.js.
// Functions operator file
(function () {
    'use strict';

    var fs = require('fs');
    var fsE = require('fs-extra')
    var path = require('path');
    //var logger = require('./logger');

    var createDictionaryIfNotExist = function (pathStr) {
        //fsE.mkdirs(pathStr);
        fsE.mkdirsSync(pathStr);
    };

    var readFile = function (filePath) {
        return fs.readFileSync(filePath, 'utf8');
    };

    var writeFile = function (filePath, data) {
        var dir = path.dirname(filePath);
        createDictionaryIfNotExist(dir);

        fs.writeFileSync(filePath, data);
    };

    var appendFile = function (filePath, data) {
        var dir = path.dirname(filePath);
        createDictionaryIfNotExist(dir);
        //browser.sleep(1000*5);
        fs.appendFileSync(filePath, data);
    };



    module.exports = {
        readFile: readFile,
        writeFile: writeFile,
        appendFile: appendFile,
        createDictionaryIfNotExist: createDictionaryIfNotExist,
    };

})();



