(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../requireModule');
    var config = requires.common.specsConfig(__filename);
    var senData = requires.sensitiveData.configs;

    var cheerio = require("cheerio"); //html parser
    var http = require("http");
    var fs = require("fs");

    var downLoadUrlList = [];
    var maxPage = 1;
    var message = "";

    // Send request
    // Get http response data
    // Parse response data
    // Get need urls into "downLoadUrlList"
    var getHtml = function (href, page, xpath) {
        var htmlData = ""; //html

        var req = http.get(href + page, function (res) {
            res.setEncoding(config.test.encoding1);

            res.on('data', function (chunk) {
                htmlData += chunk;
            });

            res.on('end', function () {
                // Parse html
                var $ = cheerio.load(htmlData);

                // Find the result element
                var resultListData = $(xpath);

                for (var i = 0; i < resultListData.length; i++) {
                    var link = resultListData[i].attribs.src;

                    if (link.indexOf("http://image.haha.mx") > -1) {
                        downLoadUrlList.push(link);
                    }
                };

                if (page == maxPage) {
                    message = util.format("===========================Download count:%s", downLoadUrlList.length);
                    console.log(message);
                    requires.logger.logFile(message, null, null, false, true);

                    if (downLoadUrlList.length > 0) {
                        download(downLoadUrlList.shift());
                    } else {
                        message = "===========================Download Complete";
                        console.log(message);
                        requires.logger.logFile(message, null, null, false, true);
                    }
                }
            });
        });
    }

    var download = function (url) {
        var narr = url.replace("http://image.haha.mx/", "").split("/");
        var data = "";

        var reqUrl = url.replace("/small/", "/big/");

        message = "Download:" + reqUrl;
        console.log(message);
        requires.logger.logFile(message, null, null, false, true);

        var req = http.get(reqUrl, function (res) {
            res.setEncoding(config.test.encoding2);
            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                var savePath = config.test.outForder + narr[0] + narr[1] + narr[2] + "_" + narr[4];
                fs.writeFile(savePath, data, config.test.encoding2, function (err) {
                    if (err) {
                        console.log(err);
                    } else {

                        message = "Save as:" + savePath;
                        console.log(message);
                        requires.logger.logFile(message, null, null, false, true);

                        if (downLoadUrlList.length > 0) {
                            download(downLoadUrlList.shift());
                        }
                    }
                });
            });
        });
    }

    var getHtml1 = function (href, page, xpath) {
        var htmlData = ""; //html
        console.log("-----------------------------------1");
        var req = http.get(href + page, function (res) {
            res.setEncoding(config.test.encoding1);

            res.on('data', function (chunk) {
                htmlData += chunk;
            });
            console.log("-----------------------------------2");
            res.on('end', function () {
                // Parse html
                var $ = cheerio.load(htmlData);

                // Find the result element
                var resultListData = $(xpath);

                for (var i = 0; i < resultListData.length; i++) {
                    var link = resultListData[i].attribs.src;

                    if (link.indexOf("http://image.haha.mx") > -1) {
                        downLoadUrlList.push(link);
                    }
                };
                console.log("-----------------------------------3");
                return downLoadUrlList;
            });
        });
    }

    var download1 = function (url) {
        var narr = url.replace("http://image.haha.mx/", "").split("/");
        var data = "";

        var reqUrl = url.replace("/small/", "/big/");

        message = "Download:" + reqUrl;
        console.log(message);
        requires.logger.logFile(message, null, null, false, true);

        var req = http.get(reqUrl, function (res) {
            res.setEncoding(config.test.encoding2);
            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on("end", function () {
                var savePath = config.test.outForder + narr[0] + narr[1] + narr[2] + "_" + narr[4];
                fs.writeFile(savePath, data, config.test.encoding2, function (err) {
                    if (err) {
                        console.log(err);
                    } else {

                        message = "Save as:" + savePath;
                        console.log(message);
                        requires.logger.logFile(message, null, null, false, true);

                        if (downLoadUrlList.length > 0) {
                            download(downLoadUrlList.shift());
                        }
                    }
                });
            });
        });
    }

    describe('crawler', function () {
        afterAll(function (done) {
            process.nextTick(done)
        });

        afterEach(function () {
            requires.domHelper.checkBrowserErrorLog()
        });

        beforeEach(function () {
            //requires.domHelper.closeAlert();
        });


        it('crawler - test', function () {

            //for (var i = 1; i <= maxPage; i++) {
            //    getHtml(config.test.mailUrl, i, config.test.filterXpath);
            //}
            //browser.sleep(1000 * 50);

            var data = getHtml1(config.test.mailUrl, 1, config.test.filterXpath);
            console.log("-----------------------------------4");
            //tt.then(function (data) {
                console.log("-----------------------------------" + data.length);
                for (var i = 0; i < data.length; i++) {
                    console.log("-----------------------------------" + data[i]);
                };

            //});
        });
    });
})();