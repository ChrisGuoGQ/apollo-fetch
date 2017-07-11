"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
function createApolloFetch(params) {
    var _this = this;
    if (params === void 0) { params = {}; }
    var uri = params.uri, customFetch = params.customFetch;
    var _uri = uri || '/graphql';
    var _middlewares = [];
    var _afterwares = [];
    var applyMiddlewares = function (requestAndOptions) {
        return new Promise(function (resolve, reject) {
            var request = requestAndOptions.request, options = requestAndOptions.options;
            var buildMiddlewareStack = function (funcs, scope) {
                var next = function () {
                    if (funcs.length > 0) {
                        var f = funcs.shift();
                        if (f) {
                            f.apply(scope, [{ request: request, options: options }, next]);
                        }
                    }
                    else {
                        resolve({
                            request: request,
                            options: options,
                        });
                    }
                };
                next();
            };
            buildMiddlewareStack(_middlewares.slice(), _this);
        });
    };
    var applyAfterwares = function (_a) {
        var response = _a.response, options = _a.options;
        return new Promise(function (resolve, reject) {
            var responseObject = { response: response, options: options };
            var buildAfterwareStack = function (funcs, scope) {
                var next = function () {
                    if (funcs.length > 0) {
                        var f = funcs.shift();
                        if (f) {
                            f.apply(scope, [responseObject, next]);
                        }
                    }
                    else {
                        resolve(responseObject);
                    }
                };
                next();
            };
            buildAfterwareStack(_afterwares.slice(), _this);
        });
    };
    var callFetch = function (_a) {
        var request = _a.request, options = _a.options;
        var data;
        try {
            data = JSON.stringify(request);
        }
        catch (e) {
            throw new Error("Network request failed. Payload is not serizable: " + e.message);
        }
        var opts = __assign({ url: _uri, data: data, method: 'POST' }, options, { headers: __assign({ Accept: '*/*', 'Content-Type': 'application/json' }, (options.headers || [])) });
        return customFetch(opts);
    };
    var throwHttpError = function (response, error) {
        var httpError;
        if (response && response.status >= 300) {
            httpError = new Error("Network request failed with status " + response.status + " - \"" + response.statusText + "\"");
        }
        else {
            httpError = new Error("Network request failed to return valid JSON");
        }
        httpError.response = response;
        httpError.parseError = error;
        throw httpError;
    };
    var apolloFetch = Object.assign(function (request) {
        var options = {};
        var parseError;
        return applyMiddlewares({
            request: request,
            options: options,
        })
            .then(callFetch)
            .then(function (response) { return response.text().then(function (raw) {
            try {
                var parsed = JSON.parse(raw);
                return __assign({}, response, { raw: raw, parsed: parsed });
            }
            catch (e) {
                parseError = e;
                return __assign({}, response, { raw: raw });
            }
        }); })
            .then(function (response) { return applyAfterwares({
            response: response,
            options: options,
        }); })
            .then(function (_a) {
            var response = _a.response;
            if (response.parsed) {
                return __assign({}, response.parsed);
            }
            else {
                throwHttpError(response, parseError);
            }
        });
    }, {
        use: function (middleware) {
            if (typeof middleware === 'function') {
                _middlewares.push(middleware);
            }
            else {
                throw new Error('Middleware must be a function');
            }
            return apolloFetch;
        },
        useAfter: function (afterware) {
            if (typeof afterware === 'function') {
                _afterwares.push(afterware);
            }
            else {
                throw new Error('Afterware must be a function');
            }
            return apolloFetch;
        },
    });
    return apolloFetch;
}
exports.createApolloFetch = createApolloFetch;
var apolloFetch = createApolloFetch();
exports.apolloFetch = apolloFetch;
//# sourceMappingURL=apollo-fetch.js.map