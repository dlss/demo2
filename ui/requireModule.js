 
var user = require('./lib/user'),
common = require('./lib/common'),
domHelper = require('./lib/domHelper'),
assert = require('./lib/assert'),
cons = require('./lib/const'),
strExt = require('./lib/extString'),
fileHelper = require('./lib/fileHelper'),
logger = require('./lib/logger'),
sensitiveData = require('./senarioes/data/sensitiveData');


module.exports = {
    user: user,
    common: common,
    domHelper: domHelper,
    assert: assert,
    cons:cons,
    strExt: strExt,
    fileHelper: fileHelper,
    logger:logger,
    // Data
    sensitiveData: sensitiveData,
};

