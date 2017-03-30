(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../../requireModule');
    var senConfig = requires.sensitiveConfig.configs;

    describe('12306', function () {
        afterAll(function (done) {
            process.nextTick(done)
        });

        afterEach(function () {
            requires.domHelper.checkBrowserErrorLog()
        });

        beforeEach(function () {
            //requires.domHelper.closeAlert();
        });


        it('12306 - Query', function () {
        });
    });
})();