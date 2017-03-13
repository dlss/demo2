var fs = require('fs'), 
	path = require('path'), 
	crypto = require('crypto'),
	Hashes = require('jshashes');

/** Function: storeScreenShot
 * Stores base64 encoded PNG data to the file at the given path.
 *
 * Parameters:
 *     (String) data - PNG data, encoded in base64
 *     (String) file - Target file path
 */
function storeScreenShot(data, file) {
	var stream = fs.createWriteStream(file);

	stream.write(new Buffer(data, 'base64'));
	stream.end();
}

/** Function: storeMetaData
 * Converts the metaData object to a JSON string and stores it to the file at
 * the given path.
 *
 * Parameters:
 *     (Object) metaData - Object to save as JSON
 *     (String) file - Target file path
 */
function storeMetaData(metaData, file) {
	var json
		, stream;

	try {
		json = JSON.stringify(metaData);
		console.log("write start:" + file + " length:" + json.length);
		stream = fs.createWriteStream(file);
        //console.log(file, json);
		stream.write(json, function(){
			console.log("write finished:" + file + " length:" + json.length);
		});
		stream.end(function(){
			console.log("stream finished:" + file + " length:" + json.length);
		});
	} catch(e) {
		console.error('Could not save meta data for ' + file);
	}
}

/** Function: gatherDescriptions
 * Traverses the parent suites of a test spec recursivly and gathers all
 * descriptions. Finally returns them as an array.
 *
 * Example:
 * If your test file has the following structure, this function returns an
 * array like ['My Tests', 'Module 1', 'Case A'] when executed for `Case A`:
 *
 *     describe('My Tests', function() {
 *         describe('Module 1', function() {
 *             it('Case A', function() { /* ... * / });
 *         });
 *     });
 *
 * Parameters:
 *     (Object) suite - Test suite
 *     (Array) soFar - Already gathered descriptions. On first call, pass an
 *                     array containing the specs description itself.
 *
 * Returns:
 *     (Array) containing the descriptions of all parental suites and the suite
 *             itself.
 */
function gatherDescriptions(suite, soFar) {
	soFar.push(suite.description);

	if(suite.parentSuite) {
		return gatherDescriptions(suite.parentSuite, soFar);
	} else {
		return soFar;
	}
}

/** Function: generateGuid
 * Generates a GUID using node.js' crypto module.
 *
 * Returns:
 *     (String) containing a guid
 */
function generateGuid() {
    var buf = new Uint16Array(8);
    buf = crypto.randomBytes(8);
    var S4 = function(num) {
            var ret = num.toString(16);
            while(ret.length < 4){
                    ret = "0"+ret;
            }
            return ret;
    };

    return (
            S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-"+S4(buf[3])+"-"+
            S4(buf[4])+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7])
    );
}

function removeDirectory(dirPath){
	try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            removeDirectory(filePath);
        }
      fs.rmdirSync(dirPath);
};

function collectBrowserLog(browserLog, logLevel) {
    var i= 0, logs = [];
    for (i; i<=browserLog.length-1; i++) {
        if (browserLog[i].level.name === logLevel) {
            logs.push(browserLog[i]);
        }
    }
    return logs;
};

function formatErrorLog(errorLogs) {
	var result = "[";
	errorLogs.forEach(function (error) {
		result += '{"level": ' + error.level + '\n';
		result += '  "message": ' + error.message + '\n';
		result += '  "timestamp: ' + error.timestamp + '\n';
		result += '  "type: ' + error.type + '},\n';
	});
	result += ']';
	return result;
};

// when found logs with specific logLevel in browser console, this method would throw an Error object.
function testBrowserErrorLog(browserLog, logLevel) {
	var errorLogs = collectBrowserLog(browserLog, logLevel);
	if (errorLogs.length) {
		throw new Error('[Browser_ERROR_LOGS] Found ' + errorLogs.length + ' Error log(s) in browser console.$$\n' + formatErrorLog(errorLogs));
	}
};

function hashCode(str) {
	if (typeof str !== 'string') {
		return 0;
	}
	return  new Hashes.MD5().hex(str);
};

module.exports = {
	storeScreenShot: storeScreenShot, 
	storeMetaData: storeMetaData, 
	gatherDescriptions: gatherDescriptions, 
	generateGuid: generateGuid, 
	removeDirectory: removeDirectory,
	collectBrowserLog: collectBrowserLog,
	formatErrorLog: formatErrorLog,
	testBrowserErrorLog,
	hashCode: hashCode
};