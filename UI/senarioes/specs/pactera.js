(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../../requireModule');
    var nodelib = requires.nodelib;
    var senConfig = requires.sensitiveConfig.pactera;
    var config = requires.config.pactera;

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
            nodelib.logger.logC(util.format("#1. Open '%s'", senConfig.modifyPwdUrl));
            browser.get(senConfig.modifyPwdUrl);

            nodelib.logger.logC("#2. Input 'User ID'");
            var userIdTextEle = element(by.xpath(config.modifyPwd.userIdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userIdTextEle, senConfig.userId)

            nodelib.logger.logC("#3. Input 'Original password'");
            var userPwdTextEle = element(by.xpath(config.modifyPwd.userPwdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userPwdTextEle, senConfig.userPwd)

            nodelib.logger.logC("#4. Input 'New password'");
            var userNewPwdTextEle = element(by.xpath(config.modifyPwd.userNewPwdTextXpath));
            requires.domHelper.safeInputWithNoAngular(userNewPwdTextEle, senConfig.newPwd)

            nodelib.logger.logC("#5. Input 'Confirm new password'");
            var userConNewTextEle = element(by.xpath(config.modifyPwd.userConNewTextXpath));
            requires.domHelper.safeInputWithNoAngular(userConNewTextEle, senConfig.conNewPwd)

            nodelib.logger.logC("#6. Submit and verify result");
            var submitEle = element(by.xpath(config.modifyPwd.submitXpath));
            //.domHelper.safeClick(submitEle);
            
            browser.sleep(1000 * 5);
        });
    });
})();