(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../../requireModule');
    var nodelib = requires.nodelib;
    var senConfig = requires.sensitiveConfig.demo;
    var config = requires.config.demo;

    describe('Demo', function () {
        afterAll(function (done) {
            process.nextTick(done)
        });

        afterEach(function () {
            requires.domHelper.checkBrowserErrorLog()
        });

        beforeEach(function () {
            //requires.domHelper.closeAlert();
        });


        it('Demo - Search question in baidu', function () {

            nodelib.logger.logC(util.format("#1. Open '%s'", config.test1.url));
            browser.get(config.test1.url);

            nodelib.logger.logC(util.format("#2. Input '%s'", senConfig.searchKey));
            var keyTextEle = element(by.xpath(config.test1.keyTextXpath));
            requires.domHelper.safeInputWithNoAngular(keyTextEle, senConfig.searchKey)

            nodelib.logger.logC("#3. Click search button");
            var searchButtonEle = element(by.xpath(config.test1.searchButtonXpath));
            requires.domHelper.safeClick(searchButtonEle);

            nodelib.logger.logC("#3. Click the first row");
            var firstSearchResultLinkEle = element(by.xpath(config.test1.firstSearchResultLinkXpath));
            requires.domHelper.safeClick(firstSearchResultLinkEle);

            //browser.sleep(1000 * 5);
        });

    });//describe end
})();//totally end