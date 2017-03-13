(function () {
    'use strict';

    exports.configs = {
        test1: {
            url: "http://www.baidu.com",
            keyTextXpath: "//input[@id='kw']",
            searchButtonXpath: "//input[@id='su']",
            firstSearchResultLinkXpath: "//*[@id='1']/h3/a",
        },

    };

    exports.user = {
        userId: "P0037651",
        pwd: "",
    }
})();