(function () {
    'use strict';

    exports.configs = {
        modifyPwd: {
            userIdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_cn']",
            userPwdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_oldpwd']",
            userNewPwdTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_newpwd']",
            userConNewTextXpath: "//form[@id='login_frm']//tr/td/input[@name='F_newpwd1']",
            submitXpath: "//form[@id='login_frm']//tr/td/input[@name='F_sub']",
        },
    };
})();