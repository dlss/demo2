(function () {
    'use strict'

    var util = require('util');
    var requires = require('./../../requireModule');
    var config = requires.common.specsConfig(__filename);
    var senData = requires.sensitiveData.configs;

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