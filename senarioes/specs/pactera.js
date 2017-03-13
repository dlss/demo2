(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../requireModule');
    var config = requires.common.specsConfig(__filename);
    var senData = requires.sensitiveData.configs;

    describe('Pactera Auto', function () {
        afterAll(function (done) {
            process.nextTick(done)
        });

        afterEach(function () {
            requires.domHelper.checkBrowserErrorLog()
        });

        beforeEach(function () {
            //requires.domHelper.closeAlert();
        });


        it('Pactera Auto - Modify Password', function () {
            requires.logger.logS(util.format("#1. Open '%s'", senData.pactera.modifyPwdUrl));
            browser.get(senData.pactera.modifyPwdUrl);

            requires.logger.logS("#2. Input 'User ID'");
            var userIdTextEle = element(by.xpath(config.modifyPwd.userIdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userIdTextEle, senData.pactera.userId)

            requires.logger.logS("#3. Input 'Original password'");
            var userPwdTextEle = element(by.xpath(config.modifyPwd.userPwdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userPwdTextEle, senData.pactera.userPwd)

            requires.logger.logS("#4. Input 'New password'");
            var userNewPwdTextEle = element(by.xpath(config.modifyPwd.userNewPwdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userNewPwdTextEle, senData.pactera.newPwd)

            requires.logger.logS("#5. Input 'Confirm new password'");
            var userConNewTextEle = element(by.xpath(config.modifyPwd.userConNewTextXpath));
            requires.domHelper.safeInputWithNoAngular(userConNewTextEle, senData.pactera.conNewPwd)

            requires.logger.logS("#6. Submit and verify result");
            var submitEle = element(by.xpath(config.modifyPwd.submitXpath));
            requires.domHelper.safeClick(submitEle);
            
            //browser.sleep(1000 * 5);
        });
    });
})();