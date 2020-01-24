'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function onCachePutFail(e) {
    console.log(e);
}

function updateCache(instance) {
    if (instance.cache) {
        instance.cache.put("data", new Response(JSON.stringify(instance.localData))).catch(onCachePutFail);
    }
}

function onCacheOpened(result) {
    this.cache = result;
    this.localData = {};
}

function MyStore() {

    this.setItem = function(name, value) {
        localStorage.setItem(name, value);

        if (this.localData && this.localData[name] !== value) {
            this.localData[name] = value;
            updateCache(this);
        }
    };

    this.getItem = function(name) {
        return localStorage.getItem(name);
    };

    this.removeItem = function(name) {
        localStorage.removeItem(name);

        if (this.localData) {
            delete this.localData[name];
            updateCache(this);
        }
    };

    try {
        if (self.caches) {
            self.caches.open("embydata").then(onCacheOpened.bind(this));
        }
    } catch (err) {
        console.log("Error opening cache: " + err);
    }
}

new MyStore;

function redetectBitrate(instance) {
    stopBitrateDetection(instance), instance.accessToken() && !1 !== instance.enableAutomaticBitrateDetection && setTimeout(redetectBitrateInternal.bind(instance), 6e3);
}

function redetectBitrateInternal() {
    this.accessToken() && this.detectBitrate();
}

function stopBitrateDetection(instance) {
    instance.detectTimeout && clearTimeout(instance.detectTimeout);
}

function replaceAll(originalString, strReplace, strWith) {
    var reg = new RegExp(strReplace, "ig");
    return originalString.replace(reg, strWith)
}

function onFetchFail(instance, url, response) {
    events.trigger(instance, "requestfail", [{
        url: url,
        status: response.status,
        errorCode: response.headers ? response.headers.get("X-Application-Error-Code") : null
    }]);
}

function paramsToString(params) {
    var values = [];
    for (var key in params) {
        var value = params[key];
        null !== value && void 0 !== value && "" !== value && values.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
    return values.join("&")
}

function fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function(resolve, reject) {
        var timeout = setTimeout(reject, timeoutMs);
        options = options || {}, options.credentials = "same-origin", fetch(url, options).then(function(response) {
            clearTimeout(timeout), resolve(response);
        }, function(error) {
            clearTimeout(timeout), reject(error);
        });
    })
}

function getFetchPromise(request) {
    var headers = request.headers || {};
    "json" === request.dataType && (headers.accept = "application/json");
    var fetchRequest = {
            headers: headers,
            method: request.type,
            credentials: "same-origin"
        },
        contentType = request.contentType;
    return request.data && ("string" == typeof request.data ? fetchRequest.body = request.data : (fetchRequest.body = paramsToString(request.data), contentType = contentType || "application/x-www-form-urlencoded; charset=UTF-8")), contentType && (headers["Content-Type"] = contentType), request.timeout ? fetchWithTimeout(request.url, fetchRequest, request.timeout) : fetch(request.url, fetchRequest)
}

function ApiClient(serverAddress, appName, appVersion, deviceName, deviceId, devicePixelRatio) {
    if (!serverAddress) throw new Error("Must supply a serverAddress");
    console.log("ApiClient serverAddress: " + serverAddress), console.log("ApiClient appName: " + appName), console.log("ApiClient appVersion: " + appVersion), console.log("ApiClient deviceName: " + deviceName), console.log("ApiClient deviceId: " + deviceId), this._serverInfo = {}, this._serverAddress = serverAddress, this._deviceId = deviceId, this._deviceName = deviceName, this._appName = appName, this._appVersion = appVersion, this._devicePixelRatio = devicePixelRatio;
}

function setSavedEndpointInfo(instance, info) {
    instance._endPointInfo = info;
}

function getTryConnectPromise(instance, url, state, resolve, reject) {
    console.log("getTryConnectPromise " + url), fetchWithTimeout(instance.getUrl("system/info/public", null, url), {
        method: "GET",
        accept: "application/json"
    }, 15e3).then(function() {
        state.resolved || (state.resolved = !0, console.log("Reconnect succeeded to " + url), instance.serverAddress(url), resolve());
    }, function() {
        state.resolved || (console.log("Reconnect failed to " + url), ++state.rejects >= state.numAddresses && reject());
    });
}

function tryReconnectInternal(instance) {
    var addresses = [],
        addressesStrings = [],
        serverInfo = instance.serverInfo();
    return serverInfo.LocalAddress && -1 === addressesStrings.indexOf(serverInfo.LocalAddress) && (addresses.push({
        url: serverInfo.LocalAddress,
        timeout: 0
    }), addressesStrings.push(addresses[addresses.length - 1].url)), serverInfo.ManualAddress && -1 === addressesStrings.indexOf(serverInfo.ManualAddress) && (addresses.push({
        url: serverInfo.ManualAddress,
        timeout: 100
    }), addressesStrings.push(addresses[addresses.length - 1].url)), serverInfo.RemoteAddress && -1 === addressesStrings.indexOf(serverInfo.RemoteAddress) && (addresses.push({
        url: serverInfo.RemoteAddress,
        timeout: 200
    }), addressesStrings.push(addresses[addresses.length - 1].url)), console.log("tryReconnect: " + addressesStrings.join("|")), new Promise(function(resolve, reject) {
        var state = {};
        state.numAddresses = addresses.length, state.rejects = 0, addresses.map(function(url) {
            setTimeout(function() {
                state.resolved || getTryConnectPromise(instance, url.url, state, resolve, reject);
            }, url.timeout);
        });
    })
}

function tryReconnect(instance, retryCount) {
    return retryCount = retryCount || 0, retryCount >= 20 ? Promise.reject() : tryReconnectInternal(instance).catch(function(err) {
        return console.log("error in tryReconnectInternal: " + (err || "")), new Promise(function(resolve, reject) {
            setTimeout(function() {
                tryReconnect(instance, retryCount + 1).then(resolve, reject);
            }, 500);
        })
    })
}

function getCachedUser(instance, userId) {
    var serverId = instance.serverId();
    if (!serverId) return null;
    var json = appStorage.getItem("user-" + userId + "-" + serverId);
    return json ? JSON.parse(json) : null
}

function onWebSocketMessage(msg) {
    var instance = this;
    msg = JSON.parse(msg.data), onMessageReceivedInternal(instance, msg);
}

function onMessageReceivedInternal(instance, msg) {
    var messageId = msg.MessageId;
    if (messageId) {
        if (messageIdsReceived[messageId]) return;
        messageIdsReceived[messageId] = !0;
    }
    if ("UserDeleted" === msg.MessageType) instance._currentUser = null;
    else if ("UserUpdated" === msg.MessageType || "UserConfigurationUpdated" === msg.MessageType) {
        var user = msg.Data;
        user.Id === instance.getCurrentUserId() && (instance._currentUser = null);
    }
    events.trigger(instance, "message", [msg]);
}

function onWebSocketOpen() {
    var instance = this;
    console.log("web socket connection opened"), events.trigger(instance, "websocketopen");
}

function onWebSocketError() {
    var instance = this;
    events.trigger(instance, "websocketerror");
}

function setSocketOnClose(apiClient, socket) {
    socket.onclose = function() {
        console.log("web socket closed"), apiClient._webSocket === socket && (console.log("nulling out web socket"), apiClient._webSocket = null), setTimeout(function() {
            events.trigger(apiClient, "websocketclose");
        }, 0);
    };
}

function normalizeReturnBitrate(instance, bitrate) {
    if (!bitrate) return instance.lastDetectedBitrate ? instance.lastDetectedBitrate : Promise.reject();
    var result = Math.round(.7 * bitrate);
    if (instance.getMaxBandwidth) {
        var maxRate = instance.getMaxBandwidth();
        maxRate && (result = Math.min(result, maxRate));
    }
    return instance.lastDetectedBitrate = result, instance.lastDetectedBitrateTime = (new Date).getTime(), result
}

function detectBitrateInternal(instance, tests, index, currentBitrate) {
    if (index >= tests.length) return normalizeReturnBitrate(instance, currentBitrate);
    var test = tests[index];
    return instance.getDownloadSpeed(test.bytes).then(function(bitrate) {
        return bitrate < test.threshold ? normalizeReturnBitrate(instance, bitrate) : detectBitrateInternal(instance, tests, index + 1, bitrate)
    }, function() {
        return normalizeReturnBitrate(instance, currentBitrate)
    })
}

function detectBitrateWithEndpointInfo(instance, endpointInfo) {
    if (endpointInfo.IsInNetwork) {
        return instance.lastDetectedBitrate = 14e7, instance.lastDetectedBitrateTime = (new Date).getTime(), 14e7
    }
    return detectBitrateInternal(instance, [{
        bytes: 5e5,
        threshold: 5e5
    }, {
        bytes: 1e6,
        threshold: 2e7
    }, {
        bytes: 3e6,
        threshold: 5e7
    }], 0)
}

function getRemoteImagePrefix(instance, options) {
    var urlPrefix;
    return options.artist ? (urlPrefix = "Artists/" + instance.encodeName(options.artist), delete options.artist) : options.person ? (urlPrefix = "Persons/" + instance.encodeName(options.person), delete options.person) : options.genre ? (urlPrefix = "Genres/" + instance.encodeName(options.genre), delete options.genre) : options.musicGenre ? (urlPrefix = "MusicGenres/" + instance.encodeName(options.musicGenre), delete options.musicGenre) : options.studio ? (urlPrefix = "Studios/" + instance.encodeName(options.studio), delete options.studio) : (urlPrefix = "Items/" + options.itemId, delete options.itemId), urlPrefix
}

function normalizeImageOptions(instance, options) {
    var ratio = instance._devicePixelRatio || 1;
    ratio && (options.minScale && (ratio = Math.max(options.minScale, ratio)), options.width && (options.width = Math.round(options.width * ratio)), options.height && (options.height = Math.round(options.height * ratio)), options.maxWidth && (options.maxWidth = Math.round(options.maxWidth * ratio)), options.maxHeight && (options.maxHeight = Math.round(options.maxHeight * ratio))), options.quality = options.quality || instance.getDefaultImageQuality(options.type), instance.normalizeImageOptions && instance.normalizeImageOptions(options);
}

function compareVersions(a, b) {
    a = a.split("."), b = b.split(".");
    for (var i = 0, length = Math.max(a.length, b.length); i < length; i++) {
        var aVal = parseInt(a[i] || "0"),
            bVal = parseInt(b[i] || "0");
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1
    }
    return 0
}
ApiClient.prototype.appName = function() {
    return this._appName
}, ApiClient.prototype.setRequestHeaders = function(headers) {
    var currentServerInfo = this.serverInfo(),
        appName = this._appName,
        accessToken = currentServerInfo.AccessToken,
        values = [];
    if (appName && values.push('Client="' + appName + '"'), this._deviceName && values.push('Device="' + this._deviceName + '"'), this._deviceId && values.push('DeviceId="' + this._deviceId + '"'), this._appVersion && values.push('Version="' + this._appVersion + '"'), accessToken && values.push('Token="' + accessToken + '"'), values.length) {
        var auth = "MediaBrowser " + values.join(", ");
        headers["X-Emby-Authorization"] = auth;
    }
}, ApiClient.prototype.appVersion = function() {
    return this._appVersion
}, ApiClient.prototype.deviceName = function() {
    return this._deviceName
}, ApiClient.prototype.deviceId = function() {
    return this._deviceId
}, ApiClient.prototype.serverAddress = function(val) {
    if (null != val) {
        if (0 !== val.toLowerCase().indexOf("http")) throw new Error("Invalid url: " + val);
        var changed = val !== this._serverAddress;
        this._serverAddress = val, this.onNetworkChange(), changed && events.trigger(this, "serveraddresschanged");
    }
    return this._serverAddress
}, ApiClient.prototype.onNetworkChange = function() {
    this.lastDetectedBitrate = 0, this.lastDetectedBitrateTime = 0, setSavedEndpointInfo(this, null), redetectBitrate(this);
}, ApiClient.prototype.getUrl = function(name, params, serverAddress) {
    if (!name) throw new Error("Url name cannot be empty");
    var url = serverAddress || this._serverAddress;
    if (!url) throw new Error("serverAddress is yet not set");
    var lowered = url.toLowerCase();
    return "/" !== name.charAt(0) && (url += "/"), url += name, params && (params = paramsToString(params)) && (url += "?" + params), url
}, ApiClient.prototype.fetchWithFailover = function(request, enableReconnection) {
    console.log("Requesting " + request.url), request.timeout = 3e4;
    var instance = this;
    return getFetchPromise(request).then(function(response) {
        return instance.lastFetch = (new Date).getTime(), response.status < 400 ? "json" === request.dataType || "application/json" === request.headers.accept ? response.json() : "text" === request.dataType || 0 === (response.headers.get("Content-Type") || "").toLowerCase().indexOf("text/") ? response.text() : response : (onFetchFail(instance, request.url, response), Promise.reject(response))
    }, function(error) {
        if (error ? console.log("Request failed to " + request.url + " " + (error.status || "") + " " + error.toString()) : console.log("Request timed out to " + request.url), error && error.status || !enableReconnection) throw console.log("Reporting request failure"), onFetchFail(instance, request.url, {}), error;
        console.log("Attempting reconnection");
        var previousServerAddress = instance.serverAddress();
        return tryReconnect(instance).then(function() {
            return console.log("Reconnect succeesed"), request.url = request.url.replace(previousServerAddress, instance.serverAddress()), instance.fetchWithFailover(request, !1)
        }, function(innerError) {
            throw console.log("Reconnect failed"), onFetchFail(instance, request.url, {}), innerError
        })
    })
}, ApiClient.prototype.fetch = function(request, includeAuthorization) {
    if (!request) throw new Error("Request cannot be null");
    if (request.headers = request.headers || {}, !1 !== includeAuthorization && this.setRequestHeaders(request.headers), !1 === this.enableAutomaticNetworking || "GET" !== request.type) {
        console.log("Requesting url without automatic networking: " + request.url);
        var instance = this;
        return getFetchPromise(request).then(function(response) {
            return instance.lastFetch = (new Date).getTime(), response.status < 400 ? "json" === request.dataType || "application/json" === request.headers.accept ? response.json() : "text" === request.dataType || 0 === (response.headers.get("Content-Type") || "").toLowerCase().indexOf("text/") ? response.text() : response : (onFetchFail(instance, request.url, response), Promise.reject(response))
        }, function(error) {
            throw onFetchFail(instance, request.url, {}), error
        })
    }
    return this.fetchWithFailover(request, !0)
}, ApiClient.prototype.setAuthenticationInfo = function(accessKey, userId) {
    this._currentUser = null, this._serverInfo.AccessToken = accessKey, this._serverInfo.UserId = userId, redetectBitrate(this);
}, ApiClient.prototype.serverInfo = function(info) {
    return info && (this._serverInfo = info), this._serverInfo
}, ApiClient.prototype.getCurrentUserId = function() {
    return this._serverInfo.UserId
}, ApiClient.prototype.accessToken = function() {
    return this._serverInfo.AccessToken
}, ApiClient.prototype.serverId = function() {
    return this.serverInfo().Id
}, ApiClient.prototype.serverName = function() {
    return this.serverInfo().Name
}, ApiClient.prototype.ajax = function(request, includeAuthorization) {
    if (!request) throw new Error("Request cannot be null");
    return this.fetch(request, includeAuthorization)
}, ApiClient.prototype.getCurrentUser = function(enableCache) {
    if (this._currentUser) return Promise.resolve(this._currentUser);
    var userId = this.getCurrentUserId();
    if (!userId) return Promise.reject();
    var user, instance = this,
        serverPromise = this.getUser(userId).then(function(user) {
            return appStorage.setItem("user-" + user.Id + "-" + user.ServerId, JSON.stringify(user)), instance._currentUser = user, user
        }, function(response) {
            if (!response.status && userId && instance.accessToken() && (user = getCachedUser(instance, userId))) return Promise.resolve(user);
            throw response
        });
    return !this.lastFetch && !1 !== enableCache && (user = getCachedUser(instance, userId)) ? Promise.resolve(user) : serverPromise
}, ApiClient.prototype.isLoggedIn = function() {
    var info = this.serverInfo();
    return !!(info && info.UserId && info.AccessToken)
}, ApiClient.prototype.logout = function() {
    stopBitrateDetection(this), this.closeWebSocket();
    var done = function() {
        appStorage.removeItem("user-" + this._currentUser.Id + "-" + this._currentUser.ServerId);
        this.setAuthenticationInfo(null, null);
    }.bind(this);
    if (this.accessToken()) {
        var url = this.getUrl("Sessions/Logout");
        return this.ajax({
            type: "POST",
            url: url
        }).then(done, done)
    }
    return done(), Promise.resolve()
}, ApiClient.prototype.authenticateUserByName = function(name, password) {
    if (!name) return Promise.reject();
    var url = this.getUrl("Users/authenticatebyname"),
        instance = this;
    return new Promise(function(resolve, reject) {
        var postData = {
            Username: name,
            Pw: password || ""
        };
        instance.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(postData),
            dataType: "json",
            contentType: "application/json"
        }).then(function(result) {
            var afterOnAuthenticated = function() {
                redetectBitrate(instance), resolve(result);
            };
            instance.onAuthenticated ? instance.onAuthenticated(instance, result).then(afterOnAuthenticated) : afterOnAuthenticated();
        }, reject);
    })
}, ApiClient.prototype.ensureWebSocket = function() {
    if (!this.isWebSocketOpenOrConnecting() && this.isWebSocketSupported()) try {
        this.openWebSocket();
    } catch (err) {
        console.log("Error opening web socket: " + err);
    }
};
var messageIdsReceived = {};
ApiClient.prototype.openWebSocket = function() {
    var accessToken = this.accessToken();
    if (!accessToken) throw new Error("Cannot open web socket without access token.");
    var url = this.getUrl("socket");
    url = replaceAll(url, "emby/socket", "embywebsocket"), url = replaceAll(url, "https:", "wss:"), url = replaceAll(url, "http:", "ws:"), url += "?api_key=" + accessToken, url += "&deviceId=" + this.deviceId(), console.log("opening web socket with url: " + url);
    var webSocket = new WebSocket(url);
    webSocket.onmessage = onWebSocketMessage.bind(this), webSocket.onopen = onWebSocketOpen.bind(this), webSocket.onerror = onWebSocketError.bind(this), setSocketOnClose(this, webSocket), this._webSocket = webSocket;
}, ApiClient.prototype.closeWebSocket = function() {
    var socket = this._webSocket;
    socket && socket.readyState === WebSocket.OPEN && socket.close();
}, ApiClient.prototype.sendWebSocketMessage = function(name, data) {
    console.log("Sending web socket message: " + name);
    var msg = {
        MessageType: name
    };
    data && (msg.Data = data), msg = JSON.stringify(msg), this._webSocket.send(msg);
}, ApiClient.prototype.sendMessage = function(name, data) {
    this.isWebSocketOpen() && this.sendWebSocketMessage(name, data);
}, ApiClient.prototype.isMessageChannelOpen = function() {
    return this.isWebSocketOpen()
}, ApiClient.prototype.isWebSocketOpen = function() {
    var socket = this._webSocket;
    return !!socket && socket.readyState === WebSocket.OPEN
}, ApiClient.prototype.isWebSocketOpenOrConnecting = function() {
    var socket = this._webSocket;
    return !!socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
}, ApiClient.prototype.get = function(url) {
    return this.ajax({
        type: "GET",
        url: url
    })
}, ApiClient.prototype.getJSON = function(url, includeAuthorization) {
    return this.fetch({
        url: url,
        type: "GET",
        dataType: "json",
        headers: {
            accept: "application/json"
        }
    }, includeAuthorization)
}, ApiClient.prototype.updateServerInfo = function(server, serverUrl) {
    if (null == server) throw new Error("server cannot be null");
    if (this.serverInfo(server), !serverUrl) throw new Error("serverUrl cannot be null. serverInfo: " + JSON.stringify(server));
    console.log("Setting server address to " + serverUrl), this.serverAddress(serverUrl);
}, ApiClient.prototype.isWebSocketSupported = function() {
    try {
        return null != WebSocket
    } catch (err) {
        return !1
    }
}, ApiClient.prototype.clearAuthenticationInfo = function() {
    this.setAuthenticationInfo(null, null);
}, ApiClient.prototype.encodeName = function(name) {
    name = name.split("/").join("-"), name = name.split("&").join("-"), name = name.split("?").join("-");
    var val = paramsToString({
        name: name
    });
    return val.substring(val.indexOf("=") + 1).replace("'", "%27")
}, ApiClient.prototype.getDownloadSpeed = function(byteSize) {
    var url = this.getUrl("Playback/BitrateTest", {
            Size: byteSize
        }),
        now = (new Date).getTime();
    return this.ajax({
        type: "GET",
        url: url,
        timeout: 5e3
    }).then(function() {
        var responseTimeSeconds = ((new Date).getTime() - now) / 1e3,
            bytesPerSecond = byteSize / responseTimeSeconds;
        return Math.round(8 * bytesPerSecond)
    })
}, ApiClient.prototype.detectBitrate = function(force) {
    if (!force && this.lastDetectedBitrate && (new Date).getTime() - (this.lastDetectedBitrateTime || 0) <= 36e5) return Promise.resolve(this.lastDetectedBitrate);
    var instance = this;
    return this.getEndpointInfo().then(function(info) {
        return detectBitrateWithEndpointInfo(instance, info)
    }, function(info) {
        return detectBitrateWithEndpointInfo(instance, {})
    })
}, ApiClient.prototype.getItem = function(userId, itemId) {
    if (!itemId) throw new Error("null itemId");
    var url = userId ? this.getUrl("Users/" + userId + "/Items/" + itemId) : this.getUrl("Items/" + itemId);
    return this.getJSON(url)
}, ApiClient.prototype.getRootFolder = function(userId) {
    if (!userId) throw new Error("null userId");
    var url = this.getUrl("Users/" + userId + "/Items/Root");
    return this.getJSON(url)
}, ApiClient.prototype.getNotificationSummary = function(userId) {
    if (!userId) throw new Error("null userId");
    var url = this.getUrl("Notifications/" + userId + "/Summary");
    return this.getJSON(url)
}, ApiClient.prototype.getNotifications = function(userId, options) {
    if (!userId) throw new Error("null userId");
    var url = this.getUrl("Notifications/" + userId, options || {});
    return this.getJSON(url)
}, ApiClient.prototype.markNotificationsRead = function(userId, idList, isRead) {
    if (!userId) throw new Error("null userId");
    if (!idList) throw new Error("null idList");
    var suffix = isRead ? "Read" : "Unread",
        params = {
            UserId: userId,
            Ids: idList.join(",")
        },
        url = this.getUrl("Notifications/" + userId + "/" + suffix, params);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getRemoteImageProviders = function(options) {
    if (!options) throw new Error("null options");
    var urlPrefix = getRemoteImagePrefix(this, options),
        url = this.getUrl(urlPrefix + "/RemoteImages/Providers", options);
    return this.getJSON(url)
}, ApiClient.prototype.getAvailableRemoteImages = function(options) {
    if (!options) throw new Error("null options");
    var urlPrefix = getRemoteImagePrefix(this, options),
        url = this.getUrl(urlPrefix + "/RemoteImages", options);
    return this.getJSON(url)
}, ApiClient.prototype.downloadRemoteImage = function(options) {
    if (!options) throw new Error("null options");
    var urlPrefix = getRemoteImagePrefix(this, options),
        url = this.getUrl(urlPrefix + "/RemoteImages/Download", options);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getRecordingFolders = function(userId) {
    var url = this.getUrl("LiveTv/Recordings/Folders", {
        userId: userId
    });
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvInfo = function(options) {
    var url = this.getUrl("LiveTv/Info", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvGuideInfo = function(options) {
    var url = this.getUrl("LiveTv/GuideInfo", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvChannel = function(id, userId) {
    if (!id) throw new Error("null id");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("LiveTv/Channels/" + id, options);
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvChannels = function(options) {
    var url = this.getUrl("LiveTv/Channels", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvPrograms = function(options) {
    return options = options || {}, options.channelIds && options.channelIds.length > 1800 ? this.ajax({
        type: "POST",
        url: this.getUrl("LiveTv/Programs"),
        data: JSON.stringify(options),
        contentType: "application/json",
        dataType: "json"
    }) : this.ajax({
        type: "GET",
        url: this.getUrl("LiveTv/Programs", options),
        dataType: "json"
    })
}, ApiClient.prototype.getLiveTvRecommendedPrograms = function(options) {
    return options = options || {}, this.ajax({
        type: "GET",
        url: this.getUrl("LiveTv/Programs/Recommended", options),
        dataType: "json"
    })
}, ApiClient.prototype.getLiveTvRecordings = function(options) {
    var url = this.getUrl("LiveTv/Recordings", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvRecordingSeries = function(options) {
    var url = this.getUrl("LiveTv/Recordings/Series", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvRecordingGroups = function(options) {
    var url = this.getUrl("LiveTv/Recordings/Groups", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvRecordingGroup = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/Recordings/Groups/" + id);
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvRecording = function(id, userId) {
    if (!id) throw new Error("null id");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("LiveTv/Recordings/" + id, options);
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvProgram = function(id, userId) {
    if (!id) throw new Error("null id");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("LiveTv/Programs/" + id, options);
    return this.getJSON(url)
}, ApiClient.prototype.deleteLiveTvRecording = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/Recordings/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.cancelLiveTvTimer = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/Timers/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.getLiveTvTimers = function(options) {
    var url = this.getUrl("LiveTv/Timers", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvTimer = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/Timers/" + id);
    return this.getJSON(url)
}, ApiClient.prototype.getNewLiveTvTimerDefaults = function(options) {
    options = options || {};
    var url = this.getUrl("LiveTv/Timers/Defaults", options);
    return this.getJSON(url)
}, ApiClient.prototype.createLiveTvTimer = function(item) {
    if (!item) throw new Error("null item");
    var url = this.getUrl("LiveTv/Timers");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(item),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateLiveTvTimer = function(item) {
    if (!item) throw new Error("null item");
    var url = this.getUrl("LiveTv/Timers/" + item.Id);
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(item),
        contentType: "application/json"
    })
}, ApiClient.prototype.resetLiveTvTuner = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/Tuners/" + id + "/Reset");
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getLiveTvSeriesTimers = function(options) {
    var url = this.getUrl("LiveTv/SeriesTimers", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getLiveTvSeriesTimer = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/SeriesTimers/" + id);
    return this.getJSON(url)
}, ApiClient.prototype.cancelLiveTvSeriesTimer = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("LiveTv/SeriesTimers/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.createLiveTvSeriesTimer = function(item) {
    if (!item) throw new Error("null item");
    var url = this.getUrl("LiveTv/SeriesTimers");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(item),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateLiveTvSeriesTimer = function(item) {
    if (!item) throw new Error("null item");
    var url = this.getUrl("LiveTv/SeriesTimers/" + item.Id);
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(item),
        contentType: "application/json"
    })
}, ApiClient.prototype.getRegistrationInfo = function(feature) {
    var url = this.getUrl("Registrations/" + feature);
    return this.getJSON(url)
}, ApiClient.prototype.getSystemInfo = function() {
    var url = this.getUrl("System/Info"),
        instance = this;
    return this.getJSON(url).then(function(info) {
        return instance.setSystemInfo(info), Promise.resolve(info)
    })
}, ApiClient.prototype.getSyncStatus = function(itemId) {
    var url = this.getUrl("Sync/" + itemId + "/Status");
    return this.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({
            TargetId: this.deviceId()
        })
    })
}, ApiClient.prototype.getPublicSystemInfo = function() {
    var url = this.getUrl("System/Info/Public"),
        instance = this;
    return this.getJSON(url).then(function(info) {
        return instance.setSystemInfo(info), Promise.resolve(info)
    })
}, ApiClient.prototype.getInstantMixFromItem = function(itemId, options) {
    var url = this.getUrl("Items/" + itemId + "/InstantMix", options);
    return this.getJSON(url)
}, ApiClient.prototype.getEpisodes = function(itemId, options) {
    var url = this.getUrl("Shows/" + itemId + "/Episodes", options);
    return this.getJSON(url)
}, ApiClient.prototype.getDisplayPreferences = function(id, userId, app) {
    var url = this.getUrl("DisplayPreferences/" + id, {
        userId: userId,
        client: app
    });
    return this.getJSON(url)
}, ApiClient.prototype.updateDisplayPreferences = function(id, obj, userId, app) {
    var url = this.getUrl("DisplayPreferences/" + id, {
        userId: userId,
        client: app
    });
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(obj),
        contentType: "application/json"
    })
}, ApiClient.prototype.getSeasons = function(itemId, options) {
    var url = this.getUrl("Shows/" + itemId + "/Seasons", options);
    return this.getJSON(url)
}, ApiClient.prototype.getSimilarItems = function(itemId, options) {
    var url = this.getUrl("Items/" + itemId + "/Similar", options);
    return this.getJSON(url)
}, ApiClient.prototype.getCultures = function() {
    var url = this.getUrl("Localization/cultures");
    return this.getJSON(url)
}, ApiClient.prototype.getCountries = function() {
    var url = this.getUrl("Localization/countries");
    return this.getJSON(url)
}, ApiClient.prototype.getPlaybackInfo = function(itemId, options, deviceProfile) {
    var postData = {
        DeviceProfile: deviceProfile
    };
    return this.ajax({
        url: this.getUrl("Items/" + itemId + "/PlaybackInfo", options),
        type: "POST",
        data: JSON.stringify(postData),
        contentType: "application/json",
        dataType: "json"
    })
}, ApiClient.prototype.getLiveStreamMediaInfo = function(liveStreamId) {
    var postData = {
        LiveStreamId: liveStreamId
    };
    return this.ajax({
        url: this.getUrl("LiveStreams/MediaInfo"),
        type: "POST",
        data: JSON.stringify(postData),
        contentType: "application/json",
        dataType: "json"
    })
}, ApiClient.prototype.getIntros = function(itemId) {
    return this.getJSON(this.getUrl("Users/" + this.getCurrentUserId() + "/Items/" + itemId + "/Intros"))
}, ApiClient.prototype.getDirectoryContents = function(path, options) {
    if (!path) throw new Error("null path");
    if ("string" != typeof path) throw new Error("invalid path");
    options = options || {}, options.path = path;
    var url = this.getUrl("Environment/DirectoryContents", options);
    return this.getJSON(url)
}, ApiClient.prototype.getNetworkShares = function(path) {
    if (!path) throw new Error("null path");
    var options = {};
    options.path = path;
    var url = this.getUrl("Environment/NetworkShares", options);
    return this.getJSON(url)
}, ApiClient.prototype.getParentPath = function(path) {
    if (!path) throw new Error("null path");
    var options = {};
    options.path = path;
    var url = this.getUrl("Environment/ParentPath", options);
    return this.ajax({
        type: "GET",
        url: url,
        dataType: "text"
    })
}, ApiClient.prototype.getDrives = function() {
    var url = this.getUrl("Environment/Drives");
    return this.getJSON(url)
}, ApiClient.prototype.getNetworkDevices = function() {
    var url = this.getUrl("Environment/NetworkDevices");
    return this.getJSON(url)
}, ApiClient.prototype.cancelPackageInstallation = function(installationId) {
    if (!installationId) throw new Error("null installationId");
    var url = this.getUrl("Packages/Installing/" + installationId);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.refreshItem = function(itemId, options) {
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Items/" + itemId + "/Refresh", options || {});
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.installPlugin = function(name, guid, updateClass, version) {
    if (!name) throw new Error("null name");
    if (!updateClass) throw new Error("null updateClass");
    var options = {
        updateClass: updateClass,
        AssemblyGuid: guid
    };
    version && (options.version = version);
    var url = this.getUrl("Packages/Installed/" + name, options);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.restartServer = function() {
    var url = this.getUrl("System/Restart");
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.shutdownServer = function() {
    var url = this.getUrl("System/Shutdown");
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getPackageInfo = function(name, guid) {
    if (!name) throw new Error("null name");
    var options = {
            AssemblyGuid: guid
        },
        url = this.getUrl("Packages/" + name, options);
    return this.getJSON(url)
}, ApiClient.prototype.getVirtualFolders = function() {
    var url = "Library/VirtualFolders";
    return url = this.getUrl(url), this.getJSON(url)
}, ApiClient.prototype.getPhysicalPaths = function() {
    var url = this.getUrl("Library/PhysicalPaths");
    return this.getJSON(url)
}, ApiClient.prototype.getServerConfiguration = function() {
    var url = this.getUrl("System/Configuration");
    return this.getJSON(url)
}, ApiClient.prototype.getDevicesOptions = function() {
    var url = this.getUrl("System/Configuration/devices");
    return this.getJSON(url)
}, ApiClient.prototype.getContentUploadHistory = function() {
    var url = this.getUrl("Devices/CameraUploads", {
        DeviceId: this.deviceId()
    });
    return this.getJSON(url)
}, ApiClient.prototype.getNamedConfiguration = function(name) {
    var url = this.getUrl("System/Configuration/" + name);
    return this.getJSON(url)
}, ApiClient.prototype.getScheduledTasks = function(options) {
    options = options || {};
    var url = this.getUrl("ScheduledTasks", options);
    return this.getJSON(url)
}, ApiClient.prototype.startScheduledTask = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("ScheduledTasks/Running/" + id);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getScheduledTask = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("ScheduledTasks/" + id);
    return this.getJSON(url)
}, ApiClient.prototype.getNextUpEpisodes = function(options) {
    var url = this.getUrl("Shows/NextUp", options);
    return this.getJSON(url)
}, ApiClient.prototype.stopScheduledTask = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("ScheduledTasks/Running/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.getPluginConfiguration = function(id) {
    if (!id) throw new Error("null Id");
    var url = this.getUrl("Plugins/" + id + "/Configuration");
    return this.getJSON(url)
}, ApiClient.prototype.getAvailablePlugins = function(options) {
    options = options || {}, options.PackageType = "UserInstalled";
    var url = this.getUrl("Packages", options);
    return this.getJSON(url)
}, ApiClient.prototype.uninstallPlugin = function(id) {
    if (!id) throw new Error("null Id");
    var url = this.getUrl("Plugins/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.removeVirtualFolder = function(name, refreshLibrary) {
    if (!name) throw new Error("null name");
    var url = "Library/VirtualFolders";
    return url = this.getUrl(url, {
        refreshLibrary: !!refreshLibrary,
        name: name
    }), this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.addVirtualFolder = function(name, type, refreshLibrary, libraryOptions) {
    if (!name) throw new Error("null name");
    var options = {};
    type && (options.collectionType = type), options.refreshLibrary = !!refreshLibrary, options.name = name;
    var url = "Library/VirtualFolders";
    return url = this.getUrl(url, options), this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            LibraryOptions: libraryOptions
        }),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateVirtualFolderOptions = function(id, libraryOptions) {
    if (!id) throw new Error("null name");
    var url = "Library/VirtualFolders/LibraryOptions";
    return url = this.getUrl(url), this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            Id: id,
            LibraryOptions: libraryOptions
        }),
        contentType: "application/json"
    })
}, ApiClient.prototype.renameVirtualFolder = function(name, newName, refreshLibrary) {
    if (!name) throw new Error("null name");
    var url = "Library/VirtualFolders/Name";
    return url = this.getUrl(url, {
        refreshLibrary: !!refreshLibrary,
        newName: newName,
        name: name
    }), this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.addMediaPath = function(virtualFolderName, mediaPath, networkSharePath, refreshLibrary) {
    if (!virtualFolderName) throw new Error("null virtualFolderName");
    if (!mediaPath) throw new Error("null mediaPath");
    var url = "Library/VirtualFolders/Paths",
        pathInfo = {
            Path: mediaPath
        };
    return networkSharePath && (pathInfo.NetworkPath = networkSharePath), url = this.getUrl(url, {
        refreshLibrary: !!refreshLibrary
    }), this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            Name: virtualFolderName,
            PathInfo: pathInfo
        }),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateMediaPath = function(virtualFolderName, pathInfo) {
    if (!virtualFolderName) throw new Error("null virtualFolderName");
    if (!pathInfo) throw new Error("null pathInfo");
    var url = "Library/VirtualFolders/Paths/Update";
    return url = this.getUrl(url), this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            Name: virtualFolderName,
            PathInfo: pathInfo
        }),
        contentType: "application/json"
    })
}, ApiClient.prototype.removeMediaPath = function(virtualFolderName, mediaPath, refreshLibrary) {
    if (!virtualFolderName) throw new Error("null virtualFolderName");
    if (!mediaPath) throw new Error("null mediaPath");
    var url = "Library/VirtualFolders/Paths";
    return url = this.getUrl(url, {
        refreshLibrary: !!refreshLibrary,
        path: mediaPath,
        name: virtualFolderName
    }), this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.deleteUser = function(id) {
    if (!id) throw new Error("null id");
    var url = this.getUrl("Users/" + id);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.deleteUserImage = function(userId, imageType, imageIndex) {
    if (!userId) throw new Error("null userId");
    if (!imageType) throw new Error("null imageType");
    var url = this.getUrl("Users/" + userId + "/Images/" + imageType);
    return null != imageIndex && (url += "/" + imageIndex), this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.deleteItemImage = function(itemId, imageType, imageIndex) {
    if (!imageType) throw new Error("null imageType");
    var url = this.getUrl("Items/" + itemId + "/Images");
    return url += "/" + imageType, null != imageIndex && (url += "/" + imageIndex), this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.deleteItem = function(itemId) {
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Items/" + itemId);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.stopActiveEncodings = function(playSessionId) {
    var options = {
        deviceId: this.deviceId()
    };
    playSessionId && (options.PlaySessionId = playSessionId);
    var url = this.getUrl("Videos/ActiveEncodings", options);
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.reportCapabilities = function(options) {
    var url = this.getUrl("Sessions/Capabilities/Full");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(options),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateItemImageIndex = function(itemId, imageType, imageIndex, newIndex) {
    if (!imageType) throw new Error("null imageType");
    var options = {
            newIndex: newIndex
        },
        url = this.getUrl("Items/" + itemId + "/Images/" + imageType + "/" + imageIndex + "/Index", options);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getItemImageInfos = function(itemId) {
    var url = this.getUrl("Items/" + itemId + "/Images");
    return this.getJSON(url)
}, ApiClient.prototype.getCriticReviews = function(itemId, options) {
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Items/" + itemId + "/CriticReviews", options);
    return this.getJSON(url)
}, ApiClient.prototype.getItemDownloadUrl = function(itemId) {
    if (!itemId) throw new Error("itemId cannot be empty");
    var url = "Items/" + itemId + "/Download";
    return this.getUrl(url, {
        api_key: this.accessToken()
    })
}, ApiClient.prototype.getSessions = function(options) {
    var url = this.getUrl("Sessions", options);
    return this.getJSON(url)
}, ApiClient.prototype.uploadUserImage = function(userId, imageType, file) {
    if (!userId) throw new Error("null userId");
    if (!imageType) throw new Error("null imageType");
    if (!file) throw new Error("File must be an image.");
    if ("image/png" !== file.type && "image/jpeg" !== file.type && "image/jpeg" !== file.type) throw new Error("File must be an image.");
    var instance = this;
    return new Promise(function(resolve, reject) {
        var reader = new FileReader;
        reader.onerror = function() {
            reject();
        }, reader.onabort = function() {
            reject();
        }, reader.onload = function(e) {
            var data = e.target.result.split(",")[1],
                url = instance.getUrl("Users/" + userId + "/Images/" + imageType);
            instance.ajax({
                type: "POST",
                url: url,
                data: data,
                contentType: "image/" + file.name.substring(file.name.lastIndexOf(".") + 1)
            }).then(resolve, reject);
        }, reader.readAsDataURL(file);
    })
}, ApiClient.prototype.uploadItemImage = function(itemId, imageType, file) {
    if (!itemId) throw new Error("null itemId");
    if (!imageType) throw new Error("null imageType");
    if (!file) throw new Error("File must be an image.");
    if ("image/png" !== file.type && "image/jpeg" !== file.type && "image/jpeg" !== file.type) throw new Error("File must be an image.");
    var url = this.getUrl("Items/" + itemId + "/Images");
    url += "/" + imageType;
    var instance = this;
    return new Promise(function(resolve, reject) {
        var reader = new FileReader;
        reader.onerror = function() {
            reject();
        }, reader.onabort = function() {
            reject();
        }, reader.onload = function(e) {
            var data = e.target.result.split(",")[1];
            instance.ajax({
                type: "POST",
                url: url,
                data: data,
                contentType: "image/" + file.name.substring(file.name.lastIndexOf(".") + 1)
            }).then(resolve, reject);
        }, reader.readAsDataURL(file);
    })
}, ApiClient.prototype.getInstalledPlugins = function() {
    var options = {},
        url = this.getUrl("Plugins", options);
    return this.getJSON(url)
}, ApiClient.prototype.getUser = function(id) {
    if (!id) throw new Error("Must supply a userId");
    var url = this.getUrl("Users/" + id);
    return this.getJSON(url)
}, ApiClient.prototype.getStudio = function(name, userId) {
    if (!name) throw new Error("null name");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Studios/" + this.encodeName(name), options);
    return this.getJSON(url)
}, ApiClient.prototype.getGenre = function(name, userId) {
    if (!name) throw new Error("null name");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Genres/" + this.encodeName(name), options);
    return this.getJSON(url)
}, ApiClient.prototype.getMusicGenre = function(name, userId) {
    if (!name) throw new Error("null name");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("MusicGenres/" + this.encodeName(name), options);
    return this.getJSON(url)
}, ApiClient.prototype.getArtist = function(name, userId) {
    if (!name) throw new Error("null name");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Artists/" + this.encodeName(name), options);
    return this.getJSON(url)
}, ApiClient.prototype.getPerson = function(name, userId) {
    if (!name) throw new Error("null name");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Persons/" + this.encodeName(name), options);
    return this.getJSON(url)
}, ApiClient.prototype.getPublicUsers = function() {
    var url = this.getUrl("users/public");
    return this.ajax({
        type: "GET",
        url: url,
        dataType: "json"
    }, !1)
}, ApiClient.prototype.getUsers = function(options) {
    var url = this.getUrl("users", options || {});
    return this.getJSON(url)
}, ApiClient.prototype.getParentalRatings = function() {
    var url = this.getUrl("Localization/ParentalRatings");
    return this.getJSON(url)
}, ApiClient.prototype.getDefaultImageQuality = function(imageType) {
    return "backdrop" === imageType.toLowerCase() ? 80 : 90
}, ApiClient.prototype.getUserImageUrl = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {};
    var url = "Users/" + userId + "/Images/" + options.type;
    return null != options.index && (url += "/" + options.index), normalizeImageOptions(this, options), delete options.type, delete options.index, this.getUrl(url, options)
}, ApiClient.prototype.getImageUrl = function(itemId, options) {
    if (!itemId) throw new Error("itemId cannot be empty");
    options = options || {};
    var url = "Items/" + itemId + "/Images/" + options.type;
    return null != options.index && (url += "/" + options.index), options.quality = options.quality || this.getDefaultImageQuality(options.type), this.normalizeImageOptions && this.normalizeImageOptions(options), delete options.type, delete options.index, this.getUrl(url, options)
}, ApiClient.prototype.getScaledImageUrl = function(itemId, options) {
    if (!itemId) throw new Error("itemId cannot be empty");
    options = options || {};
    var url = "Items/" + itemId + "/Images/" + options.type;
    return null != options.index && (url += "/" + options.index), normalizeImageOptions(this, options), delete options.type, delete options.index, delete options.minScale, this.getUrl(url, options)
}, ApiClient.prototype.getThumbImageUrl = function(item, options) {
    if (!item) throw new Error("null item");
    return options = options || {}, options.imageType = "thumb", item.ImageTags && item.ImageTags.Thumb ? (options.tag = item.ImageTags.Thumb, this.getImageUrl(item.Id, options)) : item.ParentThumbItemId ? (options.tag = item.ImageTags.ParentThumbImageTag, this.getImageUrl(item.ParentThumbItemId, options)) : null
}, ApiClient.prototype.updateUserPassword = function(userId, currentPassword, newPassword) {
    if (!userId) return Promise.reject();
    var url = this.getUrl("Users/" + userId + "/Password");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            CurrentPw: currentPassword || "",
            NewPw: newPassword
        }),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateEasyPassword = function(userId, newPassword) {
    if (!userId) return void Promise.reject();
    var url = this.getUrl("Users/" + userId + "/EasyPassword");
    return this.ajax({
        type: "POST",
        url: url,
        data: {
            NewPw: newPassword
        }
    })
}, ApiClient.prototype.resetUserPassword = function(userId) {
    if (!userId) throw new Error("null userId");
    var url = this.getUrl("Users/" + userId + "/Password"),
        postData = {};
    return postData.resetPassword = !0, this.ajax({
        type: "POST",
        url: url,
        data: postData
    })
}, ApiClient.prototype.resetEasyPassword = function(userId) {
    if (!userId) throw new Error("null userId");
    var url = this.getUrl("Users/" + userId + "/EasyPassword"),
        postData = {};
    return postData.resetPassword = !0, this.ajax({
        type: "POST",
        url: url,
        data: postData
    })
}, ApiClient.prototype.updateServerConfiguration = function(configuration) {
    if (!configuration) throw new Error("null configuration");
    var url = this.getUrl("System/Configuration");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(configuration),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateNamedConfiguration = function(name, configuration) {
    if (!configuration) throw new Error("null configuration");
    var url = this.getUrl("System/Configuration/" + name);
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(configuration),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateItem = function(item) {
    if (!item) throw new Error("null item");
    var url = this.getUrl("Items/" + item.Id);
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(item),
        contentType: "application/json"
    })
}, ApiClient.prototype.updatePluginSecurityInfo = function(info) {
    var url = this.getUrl("Plugins/SecurityInfo");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(info),
        contentType: "application/json"
    })
}, ApiClient.prototype.createUser = function(user) {
    var url = this.getUrl("Users/New");
    return this.ajax({
        type: "POST",
        url: url,
        data: user,
        dataType: "json"
    })
}, ApiClient.prototype.updateUser = function(user) {
    if (!user) throw new Error("null user");
    var url = this.getUrl("Users/" + user.Id);
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(user),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateUserPolicy = function(userId, policy) {
    if (!userId) throw new Error("null userId");
    if (!policy) throw new Error("null policy");
    var url = this.getUrl("Users/" + userId + "/Policy");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(policy),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateUserConfiguration = function(userId, configuration) {
    if (!userId) throw new Error("null userId");
    if (!configuration) throw new Error("null configuration");
    var url = this.getUrl("Users/" + userId + "/Configuration");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(configuration),
        contentType: "application/json"
    })
}, ApiClient.prototype.updateScheduledTaskTriggers = function(id, triggers) {
    if (!id) throw new Error("null id");
    if (!triggers) throw new Error("null triggers");
    var url = this.getUrl("ScheduledTasks/" + id + "/Triggers");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(triggers),
        contentType: "application/json"
    })
}, ApiClient.prototype.updatePluginConfiguration = function(id, configuration) {
    if (!id) throw new Error("null Id");
    if (!configuration) throw new Error("null configuration");
    var url = this.getUrl("Plugins/" + id + "/Configuration");
    return this.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(configuration),
        contentType: "application/json"
    })
}, ApiClient.prototype.getAncestorItems = function(itemId, userId) {
    if (!itemId) throw new Error("null itemId");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Items/" + itemId + "/Ancestors", options);
    return this.getJSON(url)
}, ApiClient.prototype.getItems = function(userId, options) {
    var url;
    return url = "string" === (typeof userId).toString().toLowerCase() ? this.getUrl("Users/" + userId + "/Items", options) : this.getUrl("Items", options), this.getJSON(url)
}, ApiClient.prototype.getResumableItems = function(userId, options) {
    return this.isMinServerVersion("3.2.33") ? this.getJSON(this.getUrl("Users/" + userId + "/Items/Resume", options)) : this.getItems(userId, Object.assign({
        SortBy: "DatePlayed",
        SortOrder: "Descending",
        Filters: "IsResumable",
        Recursive: !0,
        CollapseBoxSetItems: !1,
        ExcludeLocationTypes: "Virtual"
    }, options))
}, ApiClient.prototype.getMovieRecommendations = function(options) {
    return this.getJSON(this.getUrl("Movies/Recommendations", options))
}, ApiClient.prototype.getUpcomingEpisodes = function(options) {
    return this.getJSON(this.getUrl("Shows/Upcoming", options))
}, ApiClient.prototype.getUserViews = function(options, userId) {
    options = options || {};
    var url = this.getUrl("Users/" + (userId || this.getCurrentUserId()) + "/Views", options);
    return this.getJSON(url)
}, ApiClient.prototype.getArtists = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("Artists", options);
    return this.getJSON(url)
}, ApiClient.prototype.getAlbumArtists = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("Artists/AlbumArtists", options);
    return this.getJSON(url)
}, ApiClient.prototype.getGenres = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("Genres", options);
    return this.getJSON(url)
}, ApiClient.prototype.getMusicGenres = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("MusicGenres", options);
    return this.getJSON(url)
}, ApiClient.prototype.getPeople = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("Persons", options);
    return this.getJSON(url)
}, ApiClient.prototype.getStudios = function(userId, options) {
    if (!userId) throw new Error("null userId");
    options = options || {}, options.userId = userId;
    var url = this.getUrl("Studios", options);
    return this.getJSON(url)
}, ApiClient.prototype.getLocalTrailers = function(userId, itemId) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/LocalTrailers");
    return this.getJSON(url)
}, ApiClient.prototype.getAdditionalVideoParts = function(userId, itemId) {
    if (!itemId) throw new Error("null itemId");
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Videos/" + itemId + "/AdditionalParts", options);
    return this.getJSON(url)
}, ApiClient.prototype.getThemeMedia = function(userId, itemId, inherit) {
    if (!itemId) throw new Error("null itemId");
    var options = {};
    userId && (options.userId = userId), options.InheritFromParent = inherit || !1;
    var url = this.getUrl("Items/" + itemId + "/ThemeMedia", options);
    return this.getJSON(url)
}, ApiClient.prototype.getSearchHints = function(options) {
    var url = this.getUrl("Search/Hints", options),
        serverId = this.serverId();
    return this.getJSON(url).then(function(result) {
        return result.SearchHints.forEach(function(i) {
            i.ServerId = serverId;
        }), result
    })
}, ApiClient.prototype.getSpecialFeatures = function(userId, itemId) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/SpecialFeatures");
    return this.getJSON(url)
}, ApiClient.prototype.getDateParamValue = function(date) {
    function formatDigit(i) {
        return i < 10 ? "0" + i : i
    }
    var d = date;
    return "" + d.getFullYear() + formatDigit(d.getMonth() + 1) + formatDigit(d.getDate()) + formatDigit(d.getHours()) + formatDigit(d.getMinutes()) + formatDigit(d.getSeconds())
}, ApiClient.prototype.markPlayed = function(userId, itemId, date) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var options = {};
    date && (options.DatePlayed = this.getDateParamValue(date));
    var url = this.getUrl("Users/" + userId + "/PlayedItems/" + itemId, options);
    return this.ajax({
        type: "POST",
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.markUnplayed = function(userId, itemId) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/PlayedItems/" + itemId);
    return this.ajax({
        type: "DELETE",
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.updateFavoriteStatus = function(userId, itemId, isFavorite) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/FavoriteItems/" + itemId),
        method = isFavorite ? "POST" : "DELETE";
    return this.ajax({
        type: method,
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.updateUserItemRating = function(userId, itemId, likes) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating", {
        likes: likes
    });
    return this.ajax({
        type: "POST",
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.getItemCounts = function(userId) {
    var options = {};
    userId && (options.userId = userId);
    var url = this.getUrl("Items/Counts", options);
    return this.getJSON(url)
}, ApiClient.prototype.clearUserItemRating = function(userId, itemId) {
    if (!userId) throw new Error("null userId");
    if (!itemId) throw new Error("null itemId");
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating");
    return this.ajax({
        type: "DELETE",
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.reportPlaybackStart = function(options) {
    if (!options) throw new Error("null options");
    this.lastPlaybackProgressReport = 0, this.lastPlaybackProgressReportTicks = null, stopBitrateDetection(this);
    var url = this.getUrl("Sessions/Playing");
    return this.ajax({
        type: "POST",
        data: JSON.stringify(options),
        contentType: "application/json",
        url: url
    })
}, ApiClient.prototype.reportPlaybackProgress = function(options) {
    if (!options) throw new Error("null options");
    var newPositionTicks = options.PositionTicks;
    if ("timeupdate" === (options.EventName || "timeupdate")) {
        var now = (new Date).getTime(),
            msSinceLastReport = now - (this.lastPlaybackProgressReport || 0);
        if (msSinceLastReport <= 1e4) {
            if (!newPositionTicks) return Promise.resolve();
            var expectedReportTicks = 1e4 * msSinceLastReport + (this.lastPlaybackProgressReportTicks || 0);
            if (Math.abs((newPositionTicks || 0) - expectedReportTicks) < 5e7) return Promise.resolve()
        }
        this.lastPlaybackProgressReport = now;
    } else this.lastPlaybackProgressReport = 0;
    this.lastPlaybackProgressReportTicks = newPositionTicks;
    var url = this.getUrl("Sessions/Playing/Progress");
    return this.ajax({
        type: "POST",
        data: JSON.stringify(options),
        contentType: "application/json",
        url: url
    })
}, ApiClient.prototype.reportOfflineActions = function(actions) {
    if (!actions) throw new Error("null actions");
    var url = this.getUrl("Sync/OfflineActions");
    return this.ajax({
        type: "POST",
        data: JSON.stringify(actions),
        contentType: "application/json",
        url: url
    })
}, ApiClient.prototype.syncData = function(data) {
    if (!data) throw new Error("null data");
    var url = this.getUrl("Sync/Data");
    return this.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: url,
        dataType: "json"
    })
}, ApiClient.prototype.getReadySyncItems = function(deviceId) {
    if (!deviceId) throw new Error("null deviceId");
    var url = this.getUrl("Sync/Items/Ready", {
        TargetId: deviceId
    });
    return this.getJSON(url)
}, ApiClient.prototype.reportSyncJobItemTransferred = function(syncJobItemId) {
    if (!syncJobItemId) throw new Error("null syncJobItemId");
    var url = this.getUrl("Sync/JobItems/" + syncJobItemId + "/Transferred");
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.cancelSyncItems = function(itemIds, targetId) {
    if (!itemIds) throw new Error("null itemIds");
    var url = this.getUrl("Sync/" + (targetId || this.deviceId()) + "/Items", {
        ItemIds: itemIds.join(",")
    });
    return this.ajax({
        type: "DELETE",
        url: url
    })
}, ApiClient.prototype.reportPlaybackStopped = function(options) {
    if (!options) throw new Error("null options");
    this.lastPlaybackProgressReport = 0, this.lastPlaybackProgressReportTicks = null, redetectBitrate(this);
    var url = this.getUrl("Sessions/Playing/Stopped");
    return this.ajax({
        type: "POST",
        data: JSON.stringify(options),
        contentType: "application/json",
        url: url
    })
}, ApiClient.prototype.sendPlayCommand = function(sessionId, options) {
    if (!sessionId) throw new Error("null sessionId");
    if (!options) throw new Error("null options");
    var url = this.getUrl("Sessions/" + sessionId + "/Playing", options);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.sendCommand = function(sessionId, command) {
    if (!sessionId) throw new Error("null sessionId");
    if (!command) throw new Error("null command");
    var url = this.getUrl("Sessions/" + sessionId + "/Command"),
        ajaxOptions = {
            type: "POST",
            url: url
        };
    return ajaxOptions.data = JSON.stringify(command), ajaxOptions.contentType = "application/json", this.ajax(ajaxOptions)
}, ApiClient.prototype.sendMessageCommand = function(sessionId, options) {
    if (!sessionId) throw new Error("null sessionId");
    if (!options) throw new Error("null options");
    var url = this.getUrl("Sessions/" + sessionId + "/Message"),
        ajaxOptions = {
            type: "POST",
            url: url
        };
    return ajaxOptions.data = JSON.stringify(options), ajaxOptions.contentType = "application/json", this.ajax(ajaxOptions)
}, ApiClient.prototype.sendPlayStateCommand = function(sessionId, command, options) {
    if (!sessionId) throw new Error("null sessionId");
    if (!command) throw new Error("null command");
    var url = this.getUrl("Sessions/" + sessionId + "/Playing/" + command, options || {});
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.createPackageReview = function(review) {
    var url = this.getUrl("Packages/Reviews/" + review.id, review);
    return this.ajax({
        type: "POST",
        url: url
    })
}, ApiClient.prototype.getPackageReviews = function(packageId, minRating, maxRating, limit) {
    if (!packageId) throw new Error("null packageId");
    var options = {};
    minRating && (options.MinRating = minRating), maxRating && (options.MaxRating = maxRating), limit && (options.Limit = limit);
    var url = this.getUrl("Packages/" + packageId + "/Reviews", options);
    return this.getJSON(url)
}, ApiClient.prototype.getSavedEndpointInfo = function() {
    return this._endPointInfo
}, ApiClient.prototype.getEndpointInfo = function() {
    var savedValue = this._endPointInfo;
    if (savedValue) return Promise.resolve(savedValue);
    var instance = this;
    return this.getJSON(this.getUrl("System/Endpoint")).then(function(endPointInfo) {
        return setSavedEndpointInfo(instance, endPointInfo), endPointInfo
    })
}, ApiClient.prototype.getLatestItems = function(options) {
    return options = options || {}, this.getJSON(this.getUrl("Users/" + this.getCurrentUserId() + "/Items/Latest", options))
}, ApiClient.prototype.getFilters = function(options) {
    return this.getJSON(this.getUrl("Items/Filters2", options))
}, ApiClient.prototype.setSystemInfo = function(info) {
    this._serverVersion = info.Version;
}, ApiClient.prototype.serverVersion = function() {
    return this._serverVersion
}, ApiClient.prototype.isMinServerVersion = function(version) {
    var serverVersion = this.serverVersion();
    return !!serverVersion && compareVersions(serverVersion, version) >= 0
}, ApiClient.prototype.handleMessageReceived = function(msg) {
    onMessageReceivedInternal(this, msg);
};

/**
THere used to be a conditionnal here, obviously it doesn't work with the import/export syntax
We shoud make a build fix if we need it? (eg separate build process?)
*/
//if ("cordova" !== window.appMode && "android" !== window.appMode) {
//    export  ApiClient;
//}


function isLocalId(str) {
    return startsWith(str, localPrefix)
}

function isLocalViewId(str) {
    return startsWith(str, localViewPrefix)
}

function isTopLevelLocalViewId(str) {
    return "localview" === str
}

function stripLocalPrefix(str) {
    var res = stripStart(str, localPrefix);
    return res = stripStart(res, localViewPrefix)
}

function startsWith(str, find) {
    return !!(str && find && str.length > find.length && 0 === str.indexOf(find))
}

function stripStart(str, find) {
    return startsWith(str, find) ? str.substr(find.length) : str
}

function createEmptyList() {
    return {
        Items: [],
        TotalRecordCount: 0
    }
}

function convertGuidToLocal(guid) {
    return guid ? isLocalId(guid) ? guid : "local:" + guid : null
}

function adjustGuidProperties(downloadedItem) {
    downloadedItem.Id = convertGuidToLocal(downloadedItem.Id), downloadedItem.SeriesId = convertGuidToLocal(downloadedItem.SeriesId), downloadedItem.SeasonId = convertGuidToLocal(downloadedItem.SeasonId), downloadedItem.AlbumId = convertGuidToLocal(downloadedItem.AlbumId), downloadedItem.ParentId = convertGuidToLocal(downloadedItem.ParentId), downloadedItem.ParentThumbItemId = convertGuidToLocal(downloadedItem.ParentThumbItemId), downloadedItem.ParentPrimaryImageItemId = convertGuidToLocal(downloadedItem.ParentPrimaryImageItemId), downloadedItem.PrimaryImageItemId = convertGuidToLocal(downloadedItem.PrimaryImageItemId), downloadedItem.ParentLogoItemId = convertGuidToLocal(downloadedItem.ParentLogoItemId), downloadedItem.ParentBackdropItemId = convertGuidToLocal(downloadedItem.ParentBackdropItemId), downloadedItem.ParentBackdropImageTags = null;
}

function getLocalView(instance, serverId, userId) {
    return instance.getLocalFolders(serverId, userId).then(function(views) {
        var localView = null;
        return views.length > 0 && (localView = {
            Name: instance.downloadsTitleText || "Downloads",
            ServerId: serverId,
            Id: "localview",
            Type: "localview",
            IsFolder: !0
        }), Promise.resolve(localView)
    })
}

function ApiClientEx(serverAddress, clientName, applicationVersion, deviceName, deviceId, devicePixelRatio) {
    ApiClient.call(this, serverAddress, clientName, applicationVersion, deviceName, deviceId, devicePixelRatio);
}
var localPrefix = "local:",
    localViewPrefix = "localview:";
Object.assign(ApiClientEx.prototype, ApiClient.prototype), ApiClientEx.prototype.getPlaybackInfo = function(itemId, options, deviceProfile) {
    var onFailure = function() {
        return ApiClient.prototype.getPlaybackInfo.call(instance, itemId, options, deviceProfile)
    };
    if (isLocalId(itemId)) return localassetmanager.getLocalItem(this.serverId(), stripLocalPrefix(itemId)).then(function(item) {
        return {
            MediaSources: item.Item.MediaSources.map(function(m) {
                return m.SupportsDirectPlay = !0, m.SupportsDirectStream = !1, m.SupportsTranscoding = !1, m.IsLocal = !0, m
            })
        }
    }, onFailure);
    var instance = this;
    return localassetmanager.getLocalItem(this.serverId(), itemId).then(function(item) {
        if (item) {
            var mediaSources = item.Item.MediaSources.map(function(m) {
                return m.SupportsDirectPlay = !0, m.SupportsDirectStream = !1, m.SupportsTranscoding = !1, m.IsLocal = !0, m
            });
            return localassetmanager.fileExists(item.LocalPath).then(function(exists) {
                if (exists) {
                    var res = {
                        MediaSources: mediaSources
                    };
                    return Promise.resolve(res)
                }
                return ApiClient.prototype.getPlaybackInfo.call(instance, itemId, options, deviceProfile)
            }, onFailure)
        }
        return ApiClient.prototype.getPlaybackInfo.call(instance, itemId, options, deviceProfile)
    }, onFailure)
}, ApiClientEx.prototype.getItems = function(userId, options) {
    var i, serverInfo = this.serverInfo();
    if (serverInfo && "localview" === options.ParentId) return this.getLocalFolders(serverInfo.Id, userId).then(function(items) {
        var result = {
            Items: items,
            TotalRecordCount: items.length
        };
        return Promise.resolve(result)
    });
    if (serverInfo && options && (isLocalId(options.ParentId) || isLocalId(options.SeriesId) || isLocalId(options.SeasonId) || isLocalViewId(options.ParentId) || isLocalId(options.AlbumIds))) return localassetmanager.getViewItems(serverInfo.Id, userId, options).then(function(items) {
        items.forEach(function(item) {
            adjustGuidProperties(item);
        });
        var result = {
            Items: items,
            TotalRecordCount: items.length
        };
        return Promise.resolve(result)
    });
    if (options && options.ExcludeItemIds && options.ExcludeItemIds.length) {
        var exItems = options.ExcludeItemIds.split(",");
        for (i = 0; i < exItems.length; i++)
            if (isLocalId(exItems[i])) return Promise.resolve(createEmptyList())
    } else if (options && options.Ids && options.Ids.length) {
        var ids = options.Ids.split(","),
            hasLocal = !1;
        for (i = 0; i < ids.length; i++) isLocalId(ids[i]) && (hasLocal = !0);
        if (hasLocal) return localassetmanager.getItemsFromIds(serverInfo.Id, ids).then(function(items) {
            items.forEach(function(item) {
                adjustGuidProperties(item);
            });
            var result = {
                Items: items,
                TotalRecordCount: items.length
            };
            return Promise.resolve(result)
        })
    }
    return ApiClient.prototype.getItems.call(this, userId, options)
}, ApiClientEx.prototype.getUserViews = function(options, userId) {
    var instance = this;
    options = options || {};
    var basePromise = ApiClient.prototype.getUserViews.call(instance, options, userId);
    return options.enableLocalView ? basePromise.then(function(result) {
        var serverInfo = instance.serverInfo();
        return serverInfo ? getLocalView(instance, serverInfo.Id, userId).then(function(localView) {
            return localView && (result.Items.push(localView), result.TotalRecordCount++), Promise.resolve(result)
        }) : Promise.resolve(result)
    }) : basePromise
}, ApiClientEx.prototype.getItem = function(userId, itemId) {
    if (!itemId) throw new Error("null itemId");
    itemId && (itemId = itemId.toString());
    var serverInfo;
    return isTopLevelLocalViewId(itemId) && (serverInfo = this.serverInfo()) ? getLocalView(this, serverInfo.Id, userId) : isLocalViewId(itemId) && (serverInfo = this.serverInfo()) ? this.getLocalFolders(serverInfo.Id, userId).then(function(items) {
        var views = items.filter(function(item) {
            return item.Id === itemId
        });
        return views.length > 0 ? Promise.resolve(views[0]) : Promise.reject()
    }) : isLocalId(itemId) && (serverInfo = this.serverInfo()) ? localassetmanager.getLocalItem(serverInfo.Id, stripLocalPrefix(itemId)).then(function(item) {
        return adjustGuidProperties(item.Item), Promise.resolve(item.Item)
    }) : ApiClient.prototype.getItem.call(this, userId, itemId)
}, ApiClientEx.prototype.getLocalFolders = function(userId) {
    var serverInfo = this.serverInfo();
    return userId = userId || serverInfo.UserId, localassetmanager.getViews(serverInfo.Id, userId)
}, ApiClientEx.prototype.getNextUpEpisodes = function(options) {
    return options.SeriesId && isLocalId(options.SeriesId) ? Promise.resolve(createEmptyList()) : ApiClient.prototype.getNextUpEpisodes.call(this, options)
}, ApiClientEx.prototype.getSeasons = function(itemId, options) {
    return isLocalId(itemId) ? (options.SeriesId = itemId, options.IncludeItemTypes = "Season", options.SortBy = "SortName", this.getItems(this.getCurrentUserId(), options)) : ApiClient.prototype.getSeasons.call(this, itemId, options)
}, ApiClientEx.prototype.getEpisodes = function(itemId, options) {
    return isLocalId(options.SeasonId) || isLocalId(options.seasonId) ? (options.SeriesId = itemId, options.IncludeItemTypes = "Episode", options.SortBy = "SortName", this.getItems(this.getCurrentUserId(), options)) : isLocalId(itemId) ? (options.SeriesId = itemId, options.IncludeItemTypes = "Episode", options.SortBy = "SortName", this.getItems(this.getCurrentUserId(), options)) : ApiClient.prototype.getEpisodes.call(this, itemId, options)
}, ApiClientEx.prototype.getLatestOfflineItems = function(options) {
    options.SortBy = "DateCreated", options.SortOrder = "Descending";
    var serverInfo = this.serverInfo();
    return serverInfo ? localassetmanager.getViewItems(serverInfo.Id, null, options).then(function(items) {
        return items.forEach(function(item) {
            adjustGuidProperties(item);
        }), Promise.resolve(items)
    }) : Promise.resolve([])
}, ApiClientEx.prototype.getThemeMedia = function(userId, itemId, inherit) {
    return isLocalViewId(itemId) || isLocalId(itemId) || isTopLevelLocalViewId(itemId) ? Promise.reject() : ApiClient.prototype.getThemeMedia.call(this, userId, itemId, inherit)
}, ApiClientEx.prototype.getSpecialFeatures = function(userId, itemId) {
    return isLocalId(itemId) ? Promise.resolve([]) : ApiClient.prototype.getSpecialFeatures.call(this, userId, itemId)
}, ApiClientEx.prototype.getSimilarItems = function(itemId, options) {
    return isLocalId(itemId) ? Promise.resolve(createEmptyList()) : ApiClient.prototype.getSimilarItems.call(this, itemId, options)
}, ApiClientEx.prototype.updateFavoriteStatus = function(userId, itemId, isFavorite) {
    return isLocalId(itemId) ? Promise.resolve() : ApiClient.prototype.updateFavoriteStatus.call(this, userId, itemId, isFavorite)
}, ApiClientEx.prototype.getScaledImageUrl = function(itemId, options) {
    if (isLocalId(itemId) || options && options.itemid && isLocalId(options.itemid)) {
        var serverInfo = this.serverInfo(),
            id = stripLocalPrefix(itemId);
        return localassetmanager.getImageUrl(serverInfo.Id, id, options)
    }
    return ApiClient.prototype.getScaledImageUrl.call(this, itemId, options)
}, ApiClientEx.prototype.reportPlaybackStart = function(options) {
    if (!options) throw new Error("null options");
    return isLocalId(options.ItemId) ? Promise.resolve() : ApiClient.prototype.reportPlaybackStart.call(this, options)
}, ApiClientEx.prototype.reportPlaybackProgress = function(options) {
    if (!options) throw new Error("null options");
    if (isLocalId(options.ItemId)) {
        var serverInfo = this.serverInfo();
        return serverInfo ? localassetmanager.getLocalItem(serverInfo.Id, stripLocalPrefix(options.ItemId)).then(function(item) {
            var libraryItem = item.Item;
            return "Video" === libraryItem.MediaType || "AudioBook" === libraryItem.Type ? (libraryItem.UserData = libraryItem.UserData || {}, libraryItem.UserData.PlaybackPositionTicks = options.PositionTicks, libraryItem.UserData.PlayedPercentage = Math.min(libraryItem.RunTimeTicks ? (options.PositionTicks || 0) / libraryItem.RunTimeTicks * 100 : 0, 100), localassetmanager.addOrUpdateLocalItem(item)) : Promise.resolve()
        }) : Promise.resolve()
    }
    return ApiClient.prototype.reportPlaybackProgress.call(this, options)
}, ApiClientEx.prototype.reportPlaybackStopped = function(options) {
    if (!options) throw new Error("null options");
    if (isLocalId(options.ItemId)) {
        var serverInfo = this.serverInfo(),
            action = {
                Date: (new Date).getTime(),
                ItemId: stripLocalPrefix(options.ItemId),
                PositionTicks: options.PositionTicks,
                ServerId: serverInfo.Id,
                Type: 0,
                UserId: this.getCurrentUserId()
            };
        return localassetmanager.recordUserAction(action)
    }
    return ApiClient.prototype.reportPlaybackStopped.call(this, options)
}, ApiClientEx.prototype.getIntros = function(itemId) {
    return isLocalId(itemId) ? Promise.resolve({
        Items: [],
        TotalRecordCount: 0
    }) : ApiClient.prototype.getIntros.call(this, itemId)
}, ApiClientEx.prototype.getInstantMixFromItem = function(itemId, options) {
    return isLocalId(itemId) ? Promise.resolve({
        Items: [],
        TotalRecordCount: 0
    }) : ApiClient.prototype.getInstantMixFromItem.call(this, itemId, options)
}, ApiClientEx.prototype.getItemDownloadUrl = function(itemId) {
    if (isLocalId(itemId)) {
        var serverInfo = this.serverInfo();
        if (serverInfo) return localassetmanager.getLocalItem(serverInfo.Id, stripLocalPrefix(itemId)).then(function(item) {
            return Promise.resolve(item.LocalPath)
        })
    }
    return ApiClient.prototype.getItemDownloadUrl.call(this, itemId)
};

function getServerAddress(server, mode) {
    switch (mode) {
        case ConnectionMode.Local:
            return server.LocalAddress;

        case ConnectionMode.Manual:
            return server.ManualAddress;

        case ConnectionMode.Remote:
            return server.RemoteAddress;

        default:
            return server.ManualAddress || server.LocalAddress || server.RemoteAddress;
    }
}

function paramsToString$1(params) {
    var values = [];

    for (var key in params) {
        var value = params[key];

        if (null !== value && void 0 !== value && "" !== value) {
            values.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        }
    }

    return values.join("&");
}

function resolveFailure(instance, resolve) {
    resolve({
        State: "Unavailable",
    });
}

function mergeServers(credentialProvider, list1, list2) {
    for (var i = 0, length = list2.length; i < length; i++) {
        credentialProvider.addOrUpdateServer(list1, list2[i]);
    }

    return list1;
}

function updateServerInfo(server, systemInfo) {
    server.Name = systemInfo.ServerName;
    if (systemInfo.Id) {
        server.Id = systemInfo.Id;
    }

    if (systemInfo.LocalAddress) {
        server.LocalAddress = systemInfo.LocalAddress;
    }
}

function getEmbyServerUrl(baseUrl, handler) {
    return baseUrl + "/" + handler;
}

function getFetchPromise$1(request) {
    var headers = request.headers || {};

    if ("json" === request.dataType) {
        headers.accept = "application/json";
    }

    var fetchRequest = {
        headers: headers,
        method: request.type,
        credentials: "same-origin"
    };
    var contentType = request.contentType;

    if (request.data) {
        if ("string" == typeof request.data) {
            fetchRequest.body = request.data;
        } else {
            fetchRequest.body = paramsToString$1(request.data);
            contentType = contentType || "application/x-www-form-urlencoded; charset=UTF-8";
        }
    }

    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    if (request.timeout) {
        return fetchWithTimeout$1(request.url, fetchRequest, request.timeout);
    }

    return fetch(request.url, fetchRequest);
}

function fetchWithTimeout$1(url, options, timeoutMs) {
    console.log("fetchWithTimeout: timeoutMs: " + timeoutMs + ", url: " + url);
    return new Promise(function (resolve, reject) {
        var timeout = setTimeout(reject, timeoutMs);
        options = options || {};
        options.credentials = "same-origin";
        fetch(url, options).then(function (response) {
            clearTimeout(timeout);
            console.log("fetchWithTimeout: succeeded connecting to url: " + url);
            resolve(response);
        }, function (error) {
            clearTimeout(timeout);
            console.log("fetchWithTimeout: timed out connecting to url: " + url);
            reject();
        });
    });
}

function ajax(request) {
    if (!request) {
        throw new Error("Request cannot be null");
    }

    request.headers = request.headers || {};
    console.log("ConnectionManager requesting url: " + request.url);
    return getFetchPromise$1(request).then(function (response) {
        console.log("ConnectionManager response status: " + response.status + ", url: " + request.url);

        if (response.status < 400) {
            if ("json" === request.dataType || "application/json" === request.headers.accept) {
                return response.json();
            }

            return response;
        }

        return Promise.reject(response);
    }, function (err) {
        console.log("ConnectionManager request failed to url: " + request.url);
        throw err;
    });
}

function replaceAll$1(originalString, strReplace, strWith) {
    var reg = new RegExp(strReplace, "ig");
    return originalString.replace(reg, strWith);
}

function normalizeAddress(address) {
    address = address.trim();

    if (0 !== address.toLowerCase().indexOf("http")) {
        address = "http://" + address;
    }

    address = replaceAll$1(address, "Http:", "http:");
    address = replaceAll$1(address, "Https:", "https:");

    return address;
}

function stringEqualsIgnoreCase(str1, str2) {
    return (str1 || "").toLowerCase() === (str2 || "").toLowerCase();
}

function compareVersions$1(a, b) {
    a = a.split(".");
    b = b.split(".");

    for (var i = 0, length = Math.max(a.length, b.length); i < length; i++) {
        var aVal = parseInt(a[i] || "0");
        var bVal = parseInt(b[i] || "0");

        if (aVal < bVal) {
            return -1;
        }

        if (aVal > bVal) {
            return 1;
        }
    }

    return 0;
}

var defaultTimeout = 20000;
var ConnectionMode = {
    Local: 0,
    Remote: 1,
    Manual: 2
};

var ConnectionManager = function (credentialProvider, appName, appVersion, deviceName, deviceId, capabilities, devicePixelRatio) {

    function onAuthenticated(apiClient, result, options, saveCredentials) {
        var credentials = credentialProvider.credentials();
        var servers = credentials.Servers.filter(function (s) {
            return s.Id === result.ServerId;
        });
        var server = servers.length ? servers[0] : apiClient.serverInfo();

        if (false !== options.updateDateLastAccessed) {
            server.DateLastAccessed = new Date().getTime();
        }

        server.Id = result.ServerId;

        if (saveCredentials) {
            server.UserId = result.User.Id;
            server.AccessToken = result.AccessToken;
        } else {
            server.UserId = null;
            server.AccessToken = null;
        }

        credentialProvider.addOrUpdateServer(credentials.Servers, server);
        credentialProvider.credentials(credentials);
        apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
        apiClient.serverInfo(server);
        afterConnected(apiClient, options);
        return onLocalUserSignIn(server, apiClient.serverAddress(), result.User);
    }

    function afterConnected(apiClient, options) {
        options = options || {};

        if (false !== options.reportCapabilities) {
            apiClient.reportCapabilities(capabilities);
        }

        apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;

        if (false !== options.enableWebSocket) {
            console.log("calling apiClient.ensureWebSocket");
            apiClient.ensureWebSocket();
        }
    }

    function onLocalUserSignIn(server, serverUrl, user) {
        self._getOrAddApiClient(server, serverUrl);

        var promise = self.onLocalUserSignedIn ? self.onLocalUserSignedIn.call(self, user) : Promise.resolve();
        return promise.then(function () {
            events.trigger(self, "localusersignedin", [user]);
        })
    }

    function validateAuthentication(server, serverUrl) {
        return ajax({
            type: "GET",
            url: getEmbyServerUrl(serverUrl, "System/Info"),
            dataType: "json",
            headers: {
                "X-MediaBrowser-Token": server.AccessToken
            }
        }).then(function (systemInfo) {
            updateServerInfo(server, systemInfo);
            return Promise.resolve();
        }, function () {
            server.UserId = null;
            server.AccessToken = null;
            return Promise.resolve();
        });
    }

    function getImageUrl(localUser) {
        if (localUser && localUser.PrimaryImageTag) {
            return {
                url: self.getApiClient(localUser).getUserImageUrl(localUser.Id, {
                    tag: localUser.PrimaryImageTag,
                    type: "Primary"
                }),
                supportsParams: true
            };
        }

        return {
            url: null,
            supportsParams: false
        };
    }

    function logoutOfServer(apiClient) {
        var serverInfo = apiClient.serverInfo() || {};
        var logoutInfo = {
            serverId: serverInfo.Id
        };
        return apiClient.logout().then(function () {
            events.trigger(self, "localusersignedout", [logoutInfo]);
        }, function () {
            events.trigger(self, "localusersignedout", [logoutInfo]);
        });
    }

    function findServers() {
        return new Promise(function (resolve, reject) {
            var onFinish = function (foundServers) {
                var servers = foundServers.map(function (foundServer) {
                    var info = {
                        Id: foundServer.Id,
                        LocalAddress: convertEndpointAddressToManualAddress(foundServer) || foundServer.Address,
                        Name: foundServer.Name
                    };
                    info.LastConnectionMode = info.ManualAddress ? ConnectionMode.Manual : ConnectionMode.Local;
                    return info;
                });
                resolve(servers);
            };

            if (window.NativeShell && typeof window.NativeShell.findServers === 'function') {
                window.NativeShell.findServers(1e3).then(onFinish, function () {
                    onFinish([]);
                });
            } else {
                resolve([]);
            }
        });
    }

    function convertEndpointAddressToManualAddress(info) {
        if (info.Address && info.EndpointAddress) {
            var address = info.EndpointAddress.split(":")[0];
            var parts = info.Address.split(":");

            if (parts.length > 1) {
                var portString = parts[parts.length - 1];

                if (!isNaN(parseInt(portString))) {
                    address += ":" + portString;
                }
            }

            return normalizeAddress(address);
        }

        return null;
    }

    function getTryConnectPromise(url, connectionMode, state, resolve, reject) {
        console.log("getTryConnectPromise " + url);
        ajax({
            url: getEmbyServerUrl(url, "system/info/public"),
            timeout: defaultTimeout,
            type: "GET",
            dataType: "json"
        }).then(function (result) {
            if (!state.resolved) {
                state.resolved = true;
                console.log("Reconnect succeeded to " + url);
                resolve({
                    url: url,
                    connectionMode: connectionMode,
                    data: result
                });
            }
        }, function () {
            if (!state.resolved) {
                console.log("Reconnect failed to " + url);

                if (++state.rejects >= state.numAddresses) {
                    reject();
                }
            }
        });
    }

    function tryReconnect(serverInfo) {
        var addresses = [];
        var addressesStrings = [];

        if (!serverInfo.manualAddressOnly && serverInfo.LocalAddress && -1 === addressesStrings.indexOf(serverInfo.LocalAddress)) {
            addresses.push({
                url: serverInfo.LocalAddress,
                mode: ConnectionMode.Local,
                timeout: 0
            });
            addressesStrings.push(addresses[addresses.length - 1].url);
        }

        if (serverInfo.ManualAddress && -1 === addressesStrings.indexOf(serverInfo.ManualAddress)) {
            addresses.push({
                url: serverInfo.ManualAddress,
                mode: ConnectionMode.Manual,
                timeout: 100
            });
            addressesStrings.push(addresses[addresses.length - 1].url);
        }

        if (!serverInfo.manualAddressOnly && serverInfo.RemoteAddress && -1 === addressesStrings.indexOf(serverInfo.RemoteAddress)) {
            addresses.push({
                url: serverInfo.RemoteAddress,
                mode: ConnectionMode.Remote,
                timeout: 200
            });
            addressesStrings.push(addresses[addresses.length - 1].url);
        }

        console.log("tryReconnect: " + addressesStrings.join("|"));
        return new Promise(function (resolve, reject) {
            var state = {};
            state.numAddresses = addresses.length;
            state.rejects = 0;
            addresses.map(function (url) {
                setTimeout(function () {
                    if (!state.resolved) {
                        getTryConnectPromise(url.url, url.mode, state, resolve, reject);
                    }
                }, url.timeout);
            });
        });
    }

    function onSuccessfulConnection(server, systemInfo, connectionMode, serverUrl, options, resolve) {
        var credentials = credentialProvider.credentials();
        options = options || {};

        afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
    }

    function afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, verifyLocalAuthentication, options, resolve) {
        options = options || {};
        if (false === options.enableAutoLogin) {
            server.UserId = null;
            server.AccessToken = null;
        } else if (verifyLocalAuthentication && server.AccessToken && false !== options.enableAutoLogin) {
            return void validateAuthentication(server, serverUrl).then(function () {
                afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, false, options, resolve);
            });
        }

        updateServerInfo(server, systemInfo);
        server.LastConnectionMode = connectionMode;

        if (false !== options.updateDateLastAccessed) {
            server.DateLastAccessed = new Date().getTime();
        }

        credentialProvider.addOrUpdateServer(credentials.Servers, server);
        credentialProvider.credentials(credentials);
        var result = {
            Servers: []
        };
        result.ApiClient = self._getOrAddApiClient(server, serverUrl);
        result.ApiClient.setSystemInfo(systemInfo);
        result.State = server.AccessToken && false !== options.enableAutoLogin ? "SignedIn" : "ServerSignIn";
        result.Servers.push(server);
        result.ApiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
        result.ApiClient.updateServerInfo(server, serverUrl);

        var resolveActions = function () {
            resolve(result);
            events.trigger(self, "connected", [result]);
        };

        if ("SignedIn" === result.State) {
            afterConnected(result.ApiClient, options);
            result.ApiClient.getCurrentUser().then(function (user) {
                onLocalUserSignIn(server, serverUrl, user).then(resolveActions, resolveActions);
            }, resolveActions);
        } else {
            resolveActions();
        }
    }

    console.log("Begin ConnectionManager constructor");
    var self = this;
    this._apiClients = [];
    self._minServerVersion = "3.2.33";

    self.appVersion = function () {
        return appVersion;
    };

    self.appName = function () {
        return appName;
    };

    self.capabilities = function () {
        return capabilities;
    };

    self.deviceId = function () {
        return deviceId;
    };

    self.credentialProvider = function () {
        return credentialProvider;
    };

    self.getServerInfo = function (id) {
        return credentialProvider.credentials().Servers.filter(function (s) {
            return s.Id === id;
        })[0];
    };

    self.getLastUsedServer = function () {
        var servers = credentialProvider.credentials().Servers;
        servers.sort(function (a, b) {
            return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
        });

        if (servers.length) {
            return servers[0];
        }

        return null;
    };

    self.addApiClient = function (apiClient) {
        self._apiClients.push(apiClient);

        var existingServers = credentialProvider.credentials().Servers.filter(function (s) {
            return stringEqualsIgnoreCase(s.ManualAddress, apiClient.serverAddress()) || stringEqualsIgnoreCase(s.LocalAddress, apiClient.serverAddress()) || stringEqualsIgnoreCase(s.RemoteAddress, apiClient.serverAddress());
        });
        var existingServer = existingServers.length ? existingServers[0] : apiClient.serverInfo();

        existingServer.DateLastAccessed = new Date().getTime();
        existingServer.LastConnectionMode = ConnectionMode.Manual;
        existingServer.ManualAddress = apiClient.serverAddress();
        if (apiClient.manualAddressOnly) {
            existingServer.manualAddressOnly = true;
        }
        apiClient.serverInfo(existingServer);
        apiClient.onAuthenticated = function (instance, result) {
            return onAuthenticated(instance, result, {}, true);
        };
        if (!existingServers.length) {
            var credentials = credentialProvider.credentials();
            credentials.Servers = [existingServer];
            credentialProvider.credentials(credentials);
        }

        events.trigger(self, "apiclientcreated", [apiClient]);
    };

    self.clearData = function () {
        console.log("connection manager clearing data");
        var credentials = credentialProvider.credentials();
        credentials.Servers = [];
        credentialProvider.credentials(credentials);
    };

    self._getOrAddApiClient = function (server, serverUrl) {
        var apiClient = self.getApiClient(server.Id);

        if (!apiClient) {
            apiClient = new apiClientFactory(serverUrl, appName, appVersion, deviceName, deviceId, devicePixelRatio);
            self._apiClients.push(apiClient);
            apiClient.serverInfo(server);
            apiClient.onAuthenticated = function (instance, result) {
                return onAuthenticated(instance, result, {}, true);
            };

            events.trigger(self, "apiclientcreated", [apiClient]);
        }

        console.log("returning instance from getOrAddApiClient");
        return apiClient;
    };

    self.getOrCreateApiClient = function (serverId) {
        var credentials = credentialProvider.credentials();
        var servers = credentials.Servers.filter(function (s) {
            return stringEqualsIgnoreCase(s.Id, serverId);
        });

        if (!servers.length) {
            throw new Error("Server not found: " + serverId);
        }

        var server = servers[0];
        return self._getOrAddApiClient(server, getServerAddress(server, server.LastConnectionMode));
    };

    self.user = function (apiClient) {
        return new Promise(function (resolve, reject) {
            function onLocalUserDone(e) {
                if (apiClient && apiClient.getCurrentUserId()) {
                    apiClient.getCurrentUser().then(function (u) {
                        localUser = u;
                        var image = getImageUrl(localUser);
                        resolve({
                            localUser: localUser,
                            name: localUser ? localUser.Name : null,
                            imageUrl: image.url,
                            supportsImageParams: image.supportsParams,
                        });
                    }, onLocalUserDone);
                }
            }
            var localUser;
            if (apiClient && apiClient.getCurrentUserId()) {
                onLocalUserDone();
            }
        });
    };

    self.logout = function () {
        console.log("begin connectionManager loguot");
        var promises = [];

        for (var i = 0, length = self._apiClients.length; i < length; i++) {
            var apiClient = self._apiClients[i];

            if (apiClient.accessToken()) {
                promises.push(logoutOfServer(apiClient));
            }
        }

        return Promise.all(promises).then(function () {
            var credentials = credentialProvider.credentials();
            var servers = credentials.Servers.filter(function (u) {
                return "Guest" !== u.UserLinkType;
            });

            for (var j = 0, numServers = servers.length; j < numServers; j++) {
                var server = servers[j];
                server.UserId = null;
                server.AccessToken = null;
                server.ExchangeToken = null;
            }
        });
    };

    self.getSavedServers = function () {
        var credentials = credentialProvider.credentials();
        var servers = credentials.Servers.slice(0);
        servers.sort(function (a, b) {
            return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
        });
        return servers;
    };

    self.getAvailableServers = function () {
        console.log("Begin getAvailableServers");
        var credentials = credentialProvider.credentials();
        return Promise.all([findServers()]).then(function (responses) {
            var foundServers = responses[0];
            var servers = credentials.Servers.slice(0);
            mergeServers(credentialProvider, servers, foundServers);
            servers.sort(function (a, b) {
                return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
            });
            credentials.Servers = servers;
            credentialProvider.credentials(credentials);
            return servers;
        });
    };

    self.connectToServers = function (servers, options) {
        console.log("Begin connectToServers, with " + servers.length + " servers");
        var firstServer = servers.length ? servers[0] : null;

        if (firstServer) {
            return self.connectToServer(firstServer, options).then(function (result) {
                if ("Unavailable" === result.State) {
                    result.State = "ServerSelection";
                }

                console.log("resolving connectToServers with result.State: " + result.State);
                return result;
            });
        }

        return Promise.resolve({
            Servers: servers,
            State: "ServerSelection"
        });
    };

    self.connectToServer = function (server, options) {
        console.log("begin connectToServer");
        return new Promise(function (resolve, reject) {
            options = options || {};
            tryReconnect(server).then(function (result) {
                var serverUrl = result.url;
                var connectionMode = result.connectionMode;
                result = result.data;

                if (1 === compareVersions$1(self.minServerVersion(), result.Version)) {
                    console.log("minServerVersion requirement not met. Server version: " + result.Version);
                    resolve({
                        State: "ServerUpdateNeeded",
                        Servers: [server]
                    });
                } else {
                    if (server.Id && result.Id !== server.Id) {
                        console.log("http request succeeded, but found a different server Id than what was expected");
                        resolveFailure(self, resolve);
                    } else {
                        onSuccessfulConnection(server, result, connectionMode, serverUrl, options, resolve);
                    }
                }
            }, function () {
                resolveFailure(self, resolve);
            });
        });
    };

    self.connectToAddress = function (address, options) {
        function onFail() {
            console.log("connectToAddress " + address + " failed");
            return Promise.resolve({
                State: "Unavailable",
            });
        }

        if (!address) {
            return Promise.reject();
        }

        address = normalizeAddress(address);
        var server = {
            ManualAddress: address,
            LastConnectionMode: ConnectionMode.Manual
        };
        return self.connectToServer(server, options).catch(onFail);
    };

    self.deleteServer = function (serverId) {
        if (!serverId) {
            throw new Error("null serverId");
        }

        var server = credentialProvider.credentials().Servers.filter(function (s) {
            return s.Id === serverId;
        });
        server = server.length ? server[0] : null;
        return new Promise(function (resolve, reject) {
            function onDone() {
                var credentials = credentialProvider.credentials();
                credentials.Servers = credentials.Servers.filter(function (s) {
                    return s.Id !== serverId;
                });
                credentialProvider.credentials(credentials);
                resolve();
            }

            if (!server.ConnectServerId) {
                return void onDone();
            }
        });
    };
};

ConnectionManager.prototype.connect = function (options) {
    console.log("Begin connect");
    var instance = this;
    return instance.getAvailableServers().then(function (servers) {
        return instance.connectToServers(servers, options);
    });
};

ConnectionManager.prototype.getApiClients = function () {
    var servers = this.getSavedServers();

    for (var i = 0, length = servers.length; i < length; i++) {
        var server = servers[i];

        if (server.Id) {
            this._getOrAddApiClient(server, getServerAddress(server, server.LastConnectionMode));
        }
    }

    return this._apiClients;
};

ConnectionManager.prototype.getApiClient = function (item) {
    if (!item) {
        throw new Error("item or serverId cannot be null");
    }

    if (item.ServerId) {
        item = item.ServerId;
    }

    return this._apiClients.filter(function (a) {
        var serverInfo = a.serverInfo();
        return !serverInfo || serverInfo.Id === item;
    })[0];
};

ConnectionManager.prototype.minServerVersion = function (val) {
    if (val) {
        this._minServerVersion = val;
    }

    return this._minServerVersion;
};

ConnectionManager.prototype.handleMessageReceived = function (msg) {
    var serverId = msg.ServerId;

    if (serverId) {
        var apiClient = this.getApiClient(serverId);

        if (apiClient) {
            if ("string" == typeof msg.Data) {
                try {
                    msg.Data = JSON.parse(msg.Data);
                } catch (err) {}
            }

            apiClient.handleMessageReceived(msg);
        }
    }
};

exports.connectionManager = ConnectionManager;
