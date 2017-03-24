// extString.js.
// Functions operator string
(function () {
    'use strict';

    var util = require('util');

    var isNullOrEmpty = function (input) {
        return (input == null) || (input == '');
    };

    module.exports = {
        isNullOrEmpty: isNullOrEmpty,
    };

})();



