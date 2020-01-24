/**
Ok I don't get this, how does that translate?
Plus I don't like it in an library which I would expect to be stateless?
*/
define(["connectionManager"], function(connectionManager) {
    "use strict";
    var isSyncing;
    return {
        sync: function(options) {
            return console.log("localSync.sync starting..."), isSyncing ? Promise.resolve() : (isSyncing = !0, new Promise(function(resolve, reject) {
                require(["multiserversync", "appSettings"], function(MultiServerSync, appSettings) {
                    options = options || {}, options.cameraUploadServers = appSettings.cameraUploadServers(), (new MultiServerSync).sync(connectionManager, options).then(function() {
                        isSyncing = null, resolve()
                    }, function(err) {
                        isSyncing = null, reject(err)
                    })
                })
            }))
        }
    }
});