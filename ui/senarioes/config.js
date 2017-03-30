(function () {
    'use strict';

    exports.demo = {
        logFolder: "",
        logFileName: "",
        test1: {
            url: "http://www.baidu.com",
            keyTextXpath: "//input[@id='kw']",
            searchButtonXpath: "//input[@id='su']",
            firstSearchResultLinkXpath: "//*[@id='1']/h3/a",
        },
    };

    exports.pactera = {
        modifyPwd: {
            userIdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_cn']",
            userPwdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_oldpwd']",
            userNewPwdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_newpwd']",
            userConNewTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_newpwd1']",
            submitXpath: "//form[@id='login_frm']//tr/td/input[@name='F_sub']",
        },
    };

    exports.common = {
    };
})();