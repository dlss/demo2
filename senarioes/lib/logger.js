// logger.js.
// logger
(function () {
    'use strict';

    var path = require('path');
    var fileExt = require('./extFile');
    var cons = require('./const');

    var FLOW = protractor.promise.controlFlow();
    var rootFolder = "logs";
    var defaultLogFileExt = ".log";
    var undefined = "undefined";

    var formatDate = function (date, style) {
        var y = date.getFullYear();
        var M = "0" + (date.getMonth() + 1);
        M = M.substring(M.length - 2);
        var d = "0" + date.getDate();
        d = d.substring(d.length - 2);
        var h = "0" + date.getHours();
        h = h.substring(h.length - 2);
        var m = "0" + date.getMinutes();
        m = m.substring(m.length - 2);
        var s = "0" + date.getSeconds();
        s = s.substring(s.length - 2);

        return style.replace('yyyy', y).replace('MM', M).replace('dd', d).replace('hh', h).replace('mm', m).replace('ss', s);
    };

    //get time string as UTC
    var getCurrentTime = function () {
        return "[" + new Date().toLocaleString() + "]";
    };

    var getDefaultLogFolder = function () {
        return (rootFolder + "/" + formatDate(new Date(), "yyyy-MM-dd"));
    };

    var getDefaultLogFileName = function () {
        return formatDate(new Date(), "hh") + defaultLogFileExt;
    };

    var inLogConsole = function (info, useTimePrefix) {
        if (useTimePrefix === false) {
            console.log(info);
        }
        else {
            console.log(getCurrentTime(), info);
        }
    };

    var inLogS = function (info, useTimePrefix) {
        FLOW.execute(function () {
            inLogConsole(info, useTimePrefix);
        });
    };

    var inLogFile = function (info, fileName, folder, useTimePrefix, isNewLine) {
        var message = info;
        var logFileName = fileName;
        var logFolder = folder;

        if (useTimePrefix === true) {
            message = getCurrentTime() + message;
        }
        if (isNewLine === true) {
            message += cons.symbol.newLine;
        }
        
        if (fileName == null) {
            logFileName = getDefaultLogFileName();
        }
        if (logFolder == null) {
            logFolder = getDefaultLogFolder();
        }
        
        var fullPath = path.join(logFolder, logFileName);

        fileExt.appendFile(fullPath, message);

    };
    //---------------------------------------upper is internal------------------------------------------------
    var logFile = function (info, fileName, folder, useTimePrefix, isNewLine) {
        inLogFile(info, fileName, folder, useTimePrefix, isNewLine);
    };

    var LogConsole = function (info, useTimePrefix) {
        inLogConsole(info, useTimePrefix);
    };

    var logS = function (info, useTimePrefix) {
        inLogS(info, useTimePrefix);
    };

    module.exports = {
        logFile: logFile,
        LogConsole: LogConsole,
        logS: logS,
    };

})();



