var request = require('request'),
    q = require('q');

function getScriptUrl() {
    var defer = q.defer(),
        indexUrl = "https://unsplash.com";
    request(indexUrl, function(err, res, body) {
        var scriptFile = body.match(/<script src="(\/a\/\w+\.main\.js)"><\/script>/)[1];
        var scriptUrl = indexUrl + scriptFile;
        defer.resolve(scriptUrl);
    });
    return defer.promise;
}

function getAuthID(scriptUrl) {
    var defer = q.defer(),
        func = function(url) {
            request(url, function(err, res, body) {
                var authId = body.match(/UNSPLASH_APP_ID:"(\w+)",/)[1];
                defer.resolve(authId);
            });
        };
    if (!scriptUrl) {
        getScriptUrl().then(function(scriptUrl) {
            func(scriptUrl);
        });
    } else {
        func(scriptUrl);
    }

    return defer.promise;
}

module.exports = getAuthID;

getAuthID().then(function(id){
    console.log(id);
});