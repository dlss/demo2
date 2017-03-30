(function () {
    'use strict'
    require('shelljs/global');

    var util = require('util');
    var requires = require('./../../requireModule');
    var nodelib = requires.nodelib;
    var config = requires.config.crawler;

    var cheerio = require("cheerio"); //html parser
    var http = require("http");
    var fs = require("fs");

    var moduleName = "crawler";
    var downLoadUrlList = [];
    var maxPage = 1;
    var pageIndex = 0;
    var message = "";

    // Send request
    // Get http response data
    // Parse response data
    // Get need urls into "downLoadUrlList"
    var getHtml = function (href, filterFun, downloadFun) {
        var htmlData = ""; //html

        var req = http.get(href, function (res) {
            res.setEncoding(config.test.encoding1);

            res.on('data', function (chunk) {
                htmlData += chunk;
            });

            res.on('end', function () {
                // Parse html
                filterFun(htmlData);

                if (pageIndex == maxPage) {
                    message = util.format("===========================Download count:%s", downLoadUrlList.length);
                    nodelib.logger.log(message, 3, moduleName);

                    if (downLoadUrlList.length > 0) {
                        downloadFun(downLoadUrlList.shift());
                    }
                }
            });
        });
    }

    var downloadImg = function (url) {
        var narr = url.replace("http://image.haha.mx/", "").split("/");
        var data = "";

        var reqUrl = url.replace("/small/", "/big/");

        nodelib.logger.log("Download:" + reqUrl, 3, moduleName);

        var req = http.get(reqUrl, function (res) {
            res.setEncoding(config.test.encoding2);
            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                var savePath = config.test.outForder + narr[0] + narr[1] + narr[2] + "_" + narr[4];
                fs.writeFile(savePath, data, config.test.encoding2, function (err) {
                    if (err) {
                        nodelib.logger.log(err, 3, moduleName);
                    } else {

                        nodelib.logger.log("Save as:" + savePath, 3, moduleName);

                        if (downLoadUrlList.length > 0) {
                            downloadImg(downLoadUrlList.shift());
                        } else {
                            message = "===========================Download Complete";
                            nodelib.logger.log(message, 3, moduleName);
                        }
                    }
                });
            });
        });
    }

    var runCase_Demo = function () {
        maxPage = 1;
        mkdir('-p', config.test.outForder);

        var filterFun = function (htmlData) {
            // Parse html
            var $ = cheerio.load(htmlData);

            // Find the result element
            var resultListData = $(config.test.filterXpath);

            for (var i = 0; i < resultListData.length; i++) {
                var link = resultListData[i].attribs.src;

                if (link.indexOf("http://image.haha.mx") > -1) {
                    downLoadUrlList.push(link);
                }
            };

            pageIndex++;
        }

        for (var i = 1; i <= maxPage; i++) {
            getHtml(config.test.mailUrl + i, filterFun, downloadImg);
        }
    };

    module.exports = {
        runCase_Demo: runCase_Demo
    };
})();