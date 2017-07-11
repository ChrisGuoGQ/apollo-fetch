"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var sinon = require("sinon");
var lodash_1 = require("lodash");
var graphql_tag_1 = require("graphql-tag");
var graphql_1 = require("graphql");
var fetchMock = require("fetch-mock");
var apollo_fetch_1 = require("../src/apollo-fetch");
chai.use(chaiAsPromised);
var assert = chai.assert, expect = chai.expect;
var sampleQuery = (_a = ["\nquery SampleQuery {\n  stub{\n    id\n  }\n}\n"], _a.raw = ["\nquery SampleQuery {\n  stub{\n    id\n  }\n}\n"], graphql_tag_1.default(_a));
describe('apollo-fetch', function () {
    var postData = { hello: 'world', method: 'POST' };
    var data = JSON.stringify({ data: { hello: 'world', uri: '/graphql' } });
    var alternateData = JSON.stringify({ data: { hello: 'alternate world', uri: 'alternate' } });
    var unparsableData = 'raw string';
    var unauthorizedData = {
        data: {
            user: null,
        },
    };
    var mockError = { throws: new TypeError('mock me') };
    var swapiUrl = 'http://graphql-swapi.test/';
    var missingUrl = 'http://does-not-exist.test/';
    var unauthorizedUrl = 'http://unauthorized.test/';
    var forbiddenUrl = 'http://forbidden.test/';
    var serviceUnavailableUrl = 'http://service-unavailable.test/';
    var simpleQueryWithNoVars = (_a = ["\n    query people {\n      allPeople(first: 1) {\n        people {\n          name\n        }\n      }\n    }\n  "], _a.raw = ["\n    query people {\n      allPeople(first: 1) {\n        people {\n          name\n        }\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var simpleQueryWithVar = (_b = ["\n    query people($personNum: Int!) {\n      allPeople(first: $personNum) {\n        people {\n          name\n        }\n      }\n    }\n  "], _b.raw = ["\n    query people($personNum: Int!) {\n      allPeople(first: $personNum) {\n        people {\n          name\n        }\n      }\n    }\n  "], graphql_tag_1.default(_b));
    var simpleResult = {
        data: {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        },
    };
    var complexQueryWithTwoVars = (_c = ["\n    query people($personNum: Int!, $filmNum: Int!) {\n      allPeople(first: $personNum) {\n        people {\n          name\n          filmConnection(first: $filmNum) {\n            edges {\n              node {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  "], _c.raw = ["\n    query people($personNum: Int!, $filmNum: Int!) {\n      allPeople(first: $personNum) {\n        people {\n          name\n          filmConnection(first: $filmNum) {\n            edges {\n              node {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  "], graphql_tag_1.default(_c));
    var complexResult = {
        data: {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                        filmConnection: {
                            edges: [
                                {
                                    node: {
                                        id: 'ZmlsbXM6MQ==',
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    };
    before(function () {
        fetchMock.post('/graphql', data);
        fetchMock.post('alternate', alternateData);
        fetchMock.post('/raw', unparsableData);
        fetchMock.post('data', postData);
        fetchMock.post('error', mockError);
        fetchMock.post('test', data);
        fetchMock.post(unauthorizedUrl, unauthorizedData);
        fetchMock.post(swapiUrl, function (url, opts) {
            var _a = JSON.parse(opts.body.toString()), query = _a.query, variables = _a.variables;
            if (query === graphql_1.print(simpleQueryWithNoVars)) {
                return simpleResult;
            }
            if (query === graphql_1.print(simpleQueryWithVar)
                && lodash_1.isEqual(variables, { personNum: 1 })) {
                return simpleResult;
            }
            if (query === graphql_1.print(complexQueryWithTwoVars)
                && lodash_1.isEqual(variables, { personNum: 1, filmNum: 1 })) {
                return complexResult;
            }
            throw new Error('Invalid Query');
        });
        fetchMock.post(missingUrl, function () {
            throw new Error('Network error');
        });
        fetchMock.post(forbiddenUrl, 403);
        fetchMock.post(serviceUnavailableUrl, 503);
    });
    afterEach(fetchMock.reset);
    it('should not throw with no arguments', function () {
        assert.doesNotThrow(apollo_fetch_1.createApolloFetch);
    });
    it('should call fetch', function () {
        var fetcher = apollo_fetch_1.createApolloFetch();
        var result = fetcher({ query: graphql_1.print(sampleQuery) });
        return result.then(function (response) {
            assert.deepEqual(fetchMock.calls('/graphql').length, 1);
            assert.deepEqual(response, JSON.parse(data));
        });
    });
    var callAndCheckFetch = function (uri, fetcher) {
        var result = fetcher({ query: graphql_1.print(sampleQuery) });
        return result.then(function (response) {
            assert.deepEqual(response, JSON.parse(data));
            assert.deepEqual(fetchMock.lastCall(uri)[0], uri);
            var options = fetchMock.lastCall(uri)[1];
            var body = JSON.parse(options.body);
            assert.deepEqual(options.method, 'POST');
            assert.deepEqual(options.headers, { Accept: '*/*', 'Content-Type': 'application/json' });
            assert.deepEqual(body.query, graphql_1.print(sampleQuery));
        });
    };
    it('should call fetch with correct arguments and result', function () {
        var uri = 'test';
        var fetcher = apollo_fetch_1.createApolloFetch({ uri: uri });
        return callAndCheckFetch(uri, fetcher);
    });
    it('should make two successful requests', function () {
        var uri = 'test';
        var fetcher = apollo_fetch_1.createApolloFetch({ uri: uri });
        return callAndCheckFetch(uri, fetcher)
            .then(function () { return callAndCheckFetch(uri, fetcher); });
    });
    it('should pass an error onto the Promise', function () {
        var uri = 'error';
        var fetcher = apollo_fetch_1.createApolloFetch({ uri: uri, customFetch: fetch });
        var result = fetcher({ query: graphql_1.print(sampleQuery) });
        return assert.isRejected(result, mockError.throws, mockError.throws.message);
    });
    it('should catch on a network error', function () {
        var fetcher = apollo_fetch_1.createApolloFetch({ uri: forbiddenUrl });
        var result = fetcher({ query: graphql_1.print(sampleQuery) });
        return result.then(expect.fail)
            .catch(function (error) {
            assert.deepEqual(error.message, 'Network request failed with status 403 - \"Forbidden\"');
            assert.isDefined(error.response);
            assert.isDefined(error.parseError);
        });
    });
    it('should return a fail to parse response when fetch returns raw response', function () {
        var fetcher = apollo_fetch_1.createApolloFetch({ uri: '/raw' });
        var result = fetcher({ query: graphql_1.print(sampleQuery) });
        return result.then(expect.fail)
            .catch(function (error) {
            assert.deepEqual(error.message, 'Network request failed to return valid JSON');
            assert.isDefined(error.response);
            assert.deepEqual(error.response.raw, unparsableData);
        });
    });
    it('should pass the parsed response if valid regardless of the status', function () {
        var fetcher = apollo_fetch_1.createApolloFetch({
            uri: unauthorizedUrl,
            customFetch: function () { return new Promise(function (resolve, reject) {
                var init = {
                    status: 401,
                    statusText: 'Unauthorized',
                };
                var body = JSON.stringify(unauthorizedData);
                resolve(new Response(body, init));
            }); },
        });
        return fetcher({ query: graphql_1.print(sampleQuery) }).then(function (result) {
            assert.deepEqual(result.data, unauthorizedData.data);
        });
    });
    describe('apolloFetch wrapper', function () {
        it('should take a operation make a call to fetch at /graphql with the correct body', function () {
            var operation = { variables: {} };
            return apollo_fetch_1.apolloFetch(operation).then(function (result) {
                assert.deepEqual(result, JSON.parse(data));
                assert.deepEqual(JSON.parse(fetchMock.lastCall()[1].body), operation);
            });
        });
    });
    describe('middleware', function () {
        it('should throw an error if middleware is not a function', function () {
            var malWare = {};
            var apolloFetch = apollo_fetch_1.createApolloFetch({ uri: '/graphql' });
            try {
                apolloFetch.use(malWare);
                expect.fail();
            }
            catch (error) {
                assert.equal(error.message, 'Middleware must be a function');
            }
        });
        it('should return errors thrown in middlewares', function () {
            var apolloFetch = apollo_fetch_1.createApolloFetch({ uri: swapiUrl });
            apolloFetch.use(function () { throw Error('Middleware error'); });
            var simpleRequest = {
                query: graphql_1.print(simpleQueryWithNoVars),
                variables: {},
                debugName: 'People query',
            };
            return assert.isRejected(apolloFetch(simpleRequest), Error, 'Middleware error');
        });
        it('can alter the request variables', function () {
            var testWare1 = TestWare([
                { key: 'personNum', val: 1 },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: swapiUrl });
            swapi.use(testWare1);
            var simpleRequest = {
                query: graphql_1.print(simpleQueryWithVar),
                variables: {},
                debugName: 'People query',
            };
            return assert.eventually.deepEqual(swapi(simpleRequest), simpleResult);
        });
        it('can alter the options', function () {
            var testWare1 = TestWare([], [
                { key: 'planet', val: 'mars' },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: swapiUrl });
            swapi.use(testWare1);
            var simpleRequest = {
                query: graphql_1.print(simpleQueryWithNoVars),
                variables: {},
                debugName: 'People query',
            };
            return swapi(simpleRequest).then(function () {
                assert.equal(fetchMock.lastCall()[1].planet, 'mars');
            });
        });
        it('can alter the request body params', function () {
            var testWare1 = TestWare([], [], [
                { key: 'newParam', val: '0123456789' },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.use(testWare1);
            var simpleRequest = {
                query: graphql_1.print(simpleQueryWithVar),
                variables: { personNum: 1 },
                debugName: 'People query',
            };
            return swapi(simpleRequest).then(function () {
                return assert.deepEqual(JSON.parse(fetchMock.lastCall()[1].body), {
                    query: 'query people($personNum: Int!) {\n  allPeople(first: $personNum) {\n    people {\n      name\n    }\n  }\n}\n',
                    variables: { personNum: 1 },
                    debugName: 'People query',
                    newParam: '0123456789',
                });
            });
        });
        it('handle multiple middlewares', function () {
            var testWare1 = TestWare([
                { key: 'personNum', val: 1 },
            ]);
            var testWare2 = TestWare([
                { key: 'filmNum', val: 1 },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.use(testWare1).use(testWare2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {},
                debugName: 'People query',
            };
            return assert.eventually.deepEqual(swapi(simpleRequest), complexResult);
        });
        it('should chain use() calls', function () {
            var testWare1 = TestWare([
                { key: 'personNum', val: 1 },
            ]);
            var testWare2 = TestWare([
                { key: 'filmNum', val: 1 },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: swapiUrl });
            swapi.use(testWare1)
                .use(testWare2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {},
                debugName: 'People query',
            };
            return assert.eventually.deepEqual(swapi(simpleRequest), complexResult);
        });
    });
    describe('afterware', function () {
        it('should return errors thrown in afterwares', function () {
            var apolloFetch = apollo_fetch_1.createApolloFetch({ uri: swapiUrl });
            apolloFetch.useAfter(function () { throw Error('Afterware error'); });
            var simpleRequest = {
                query: graphql_1.print(simpleQueryWithNoVars),
                variables: {},
                debugName: 'People query',
            };
            return assert.isRejected(apolloFetch(simpleRequest), Error, 'Afterware error');
        });
        it('should throw an error if afterware is not a function', function () {
            var malWare = {};
            var apolloFetch = apollo_fetch_1.createApolloFetch({ uri: '/graphql' });
            try {
                apolloFetch.useAfter(malWare);
                expect.fail();
            }
            catch (error) {
                assert.equal(error.message, 'Afterware must be a function');
            }
        });
        it('can modify response to add data when reponse is unparsable', function () {
            var parsedData = {
                data: {
                    mock: 'stub',
                },
            };
            var afterware = function (_a, next) {
                var response = _a.response;
                assert.deepEqual(response.status, 403);
                assert.deepEqual(response.raw, '');
                assert.isUndefined(response.parsed);
                response.parsed = parsedData;
                next();
            };
            var apolloFetch = apollo_fetch_1.createApolloFetch({ uri: forbiddenUrl });
            apolloFetch.useAfter(afterware);
            return assert.eventually.deepEqual(apolloFetch({ query: '' }), parsedData);
        });
        it('handle multiple afterware', function () {
            var spy = sinon.spy();
            var afterware1 = function (_a, next) {
                var response = _a.response;
                assert.deepEqual(response.status, 200);
                spy();
                next();
            };
            var afterware2 = function (_a, next) {
                var response = _a.response;
                spy();
                next();
            };
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.useAfter(afterware1);
            swapi.useAfter(afterware2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {
                    personNum: 1,
                    filmNum: 1,
                },
                debugName: 'People query',
            };
            return swapi(simpleRequest).then(function (result) {
                assert.deepEqual(result, complexResult);
                assert(spy.calledTwice, 'both aftwerware should be called');
            }).catch(console.log);
        });
    });
    describe('multiple requests', function () {
        it('handle multiple middlewares', function () {
            var testWare1 = TestWare([
                { key: 'personNum', val: 1 },
            ]);
            var testWare2 = TestWare([
                { key: 'filmNum', val: 1 },
            ]);
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.use(testWare1).use(testWare2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {},
                debugName: 'People query',
            };
            return assert.eventually.deepEqual(swapi(simpleRequest), complexResult).then(function () { return assert.eventually.deepEqual(swapi(simpleRequest), complexResult); });
        });
        it('handle multiple afterware', function () {
            var spy = sinon.spy();
            var afterware1 = function (_a, next) {
                var response = _a.response;
                assert.deepEqual(response.status, 200);
                spy();
                next();
            };
            var afterware2 = function (_a, next) {
                var response = _a.response;
                spy();
                next();
            };
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.useAfter(afterware1).useAfter(afterware2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {
                    personNum: 1,
                    filmNum: 1,
                },
                debugName: 'People query',
            };
            return swapi(simpleRequest).then(function (result) {
                assert.deepEqual(result, complexResult);
                assert(spy.calledTwice, 'both aftwerware should be called');
                spy.reset();
            }).then(function () { return swapi(simpleRequest).then(function (result) {
                assert.deepEqual(result, complexResult);
                assert(spy.calledTwice, 'both aftwerware should be called');
            }); });
        });
        it('handle multiple middleware and afterware', function () {
            var testWare1 = TestWare([
                { key: 'personNum', val: 1 },
            ]);
            var testWare2 = TestWare([
                { key: 'filmNum', val: 1 },
            ]);
            var spy = sinon.spy();
            var afterware1 = function (_a, next) {
                var response = _a.response;
                assert.deepEqual(response.status, 200);
                spy();
                next();
            };
            var afterware2 = function (_a, next) {
                var response = _a.response;
                spy();
                next();
            };
            var swapi = apollo_fetch_1.createApolloFetch({ uri: 'http://graphql-swapi.test/' });
            swapi.useAfter(afterware1).useAfter(afterware2)
                .use(testWare1).use(testWare2);
            var simpleRequest = {
                query: graphql_1.print(complexQueryWithTwoVars),
                variables: {},
                debugName: 'People query',
            };
            return swapi(simpleRequest).then(function (result) {
                assert.deepEqual(result, complexResult);
                assert(spy.calledTwice, 'both aftwerware should be called');
                spy.reset();
            }).then(function () { return swapi(simpleRequest).then(function (result) {
                assert.deepEqual(result, complexResult);
                assert(spy.calledTwice, 'both aftwerware should be called');
            }); });
        });
    });
    var _a, _b, _c;
});
function TestWare(variables, options, bodyParams) {
    if (variables === void 0) { variables = []; }
    if (options === void 0) { options = []; }
    if (bodyParams === void 0) { bodyParams = []; }
    return function (request, next) {
        variables.map(function (variable) {
            request.request.variables[variable.key] = variable.val;
        });
        options.map(function (variable) {
            request.options[variable.key] = variable.val;
        });
        bodyParams.map(function (param) {
            request.request[param.key] = param.val;
        });
        next();
    };
}
var _a;
//# sourceMappingURL=apollo-fetch.js.map