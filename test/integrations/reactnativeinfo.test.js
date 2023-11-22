var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ReactNativeInfo } from '../../src/js/integrations/reactnativeinfo';
let mockedIsHermesEnabled;
let mockedIsTurboModuleEnabled;
let mockedIsFabricEnabled;
let mockedGetReactNativeVersion;
let mockedGetHermesVersion;
let mockedIsExpo;
jest.mock('../../src/js/utils/environment', () => ({
    isHermesEnabled: () => mockedIsHermesEnabled(),
    isTurboModuleEnabled: () => mockedIsTurboModuleEnabled(),
    isFabricEnabled: () => mockedIsFabricEnabled(),
    getReactNativeVersion: () => mockedGetReactNativeVersion(),
    getHermesVersion: () => mockedGetHermesVersion(),
    isExpo: () => mockedIsExpo(),
}));
describe('React Native Info', () => {
    beforeEach(() => {
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        mockedIsTurboModuleEnabled = jest.fn().mockReturnValue(false);
        mockedIsFabricEnabled = jest.fn().mockReturnValue(false);
        mockedGetReactNativeVersion = jest.fn().mockReturnValue('1000.0.0-test');
        mockedGetHermesVersion = jest.fn().mockReturnValue(undefined);
        mockedIsExpo = jest.fn().mockReturnValue(false);
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    it('does not pollute event with undefined fields', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockEvent = {
            message: 'test',
        };
        const mockedHint = {};
        const actualEvent = yield executeIntegrationFor(mockEvent, mockedHint);
        expectMocksToBeCalledOnce();
        expect(actualEvent).toEqual({
            message: 'test',
            contexts: {
                react_native_context: {
                    turbo_module: false,
                    fabric: false,
                    js_engine: 'hermes',
                    hermes_debug_info: true,
                    react_native_version: '1000.0.0-test',
                    expo: false,
                },
            },
            tags: {
                hermes: 'true',
            },
        });
    }));
    it('adds hermes tag and js_engine to context if hermes enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        mockedGetHermesVersion = jest.fn().mockReturnValue('for RN 999.0.0');
        const actualEvent = yield executeIntegrationFor({}, {});
        expectMocksToBeCalledOnce();
        expect((_a = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.tags) === null || _a === void 0 ? void 0 : _a.hermes).toEqual('true');
        expect((_b = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _b === void 0 ? void 0 : _b.react_native_context).toEqual(expect.objectContaining({
            js_engine: 'hermes',
            hermes_version: 'for RN 999.0.0',
        }));
    }));
    it('does not override existing hermes tag', () => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        const mockedEvent = {
            tags: {
                hermes: 'test_hermes_tag',
            },
        };
        const actualEvent = yield executeIntegrationFor(mockedEvent, {});
        expectMocksToBeCalledOnce();
        expect((_c = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.tags) === null || _c === void 0 ? void 0 : _c.hermes).toEqual('test_hermes_tag');
    }));
    it('adds engine from rn error', () => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e, _f;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(false);
        const mockedHint = {
            originalException: {
                jsEngine: 'test_engine',
            },
        };
        const actualEvent = yield executeIntegrationFor({}, mockedHint);
        expectMocksToBeCalledOnce();
        expect((_d = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.tags) === null || _d === void 0 ? void 0 : _d.hermes).toEqual(undefined);
        expect((_f = (_e = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _e === void 0 ? void 0 : _e.react_native_context) === null || _f === void 0 ? void 0 : _f.js_engine).toEqual('test_engine');
    }));
    it('adds component stack', () => __awaiter(void 0, void 0, void 0, function* () {
        var _g, _h;
        const mockedHint = {
            originalException: {
                componentStack: 'test_stack',
            },
        };
        const actualEvent = yield executeIntegrationFor({}, mockedHint);
        expectMocksToBeCalledOnce();
        expect((_h = (_g = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _g === void 0 ? void 0 : _g.react_native_context) === null || _h === void 0 ? void 0 : _h.component_stack).toEqual('test_stack');
    }));
    it('marks turbo modules enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        var _j, _k;
        mockedIsTurboModuleEnabled = jest.fn().mockReturnValue(true);
        const actualEvent = yield executeIntegrationFor({}, {});
        expectMocksToBeCalledOnce();
        expect((_k = (_j = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _j === void 0 ? void 0 : _j.react_native_context) === null || _k === void 0 ? void 0 : _k.turbo_module).toEqual(true);
    }));
    it('marks fabric enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        var _l, _m;
        mockedIsFabricEnabled = jest.fn().mockReturnValue(true);
        const actualEvent = yield executeIntegrationFor({}, {});
        expectMocksToBeCalledOnce();
        expect((_m = (_l = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _l === void 0 ? void 0 : _l.react_native_context) === null || _m === void 0 ? void 0 : _m.fabric).toEqual(true);
    }));
    it('does not override existing react_native_context', () => __awaiter(void 0, void 0, void 0, function* () {
        var _o;
        const mockedEvent = {
            contexts: {
                react_native_context: {
                    test: 'context',
                },
            },
        };
        const actualEvent = yield executeIntegrationFor(mockedEvent, {});
        expectMocksToBeCalledOnce();
        expect((_o = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _o === void 0 ? void 0 : _o.react_native_context).toEqual({
            test: 'context',
        });
    }));
    it('add hermes_debug_info to react_native_context based on exception frames (hermes bytecode frames present -> no debug info)', () => __awaiter(void 0, void 0, void 0, function* () {
        var _p, _q;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        const mockedEvent = {
            exception: {
                values: [
                    {
                        stacktrace: {
                            frames: [
                                {
                                    platform: 'java',
                                    lineno: 2,
                                },
                                {
                                    lineno: 1,
                                },
                            ],
                        },
                    },
                ],
            },
        };
        const actualEvent = yield executeIntegrationFor(mockedEvent, {});
        expectMocksToBeCalledOnce();
        expect((_q = (_p = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _p === void 0 ? void 0 : _p.react_native_context) === null || _q === void 0 ? void 0 : _q.hermes_debug_info).toEqual(false);
    }));
    it('does not hermes_debug_info to react_native_context based on threads frames (hermes bytecode frames present -> no debug info)', () => __awaiter(void 0, void 0, void 0, function* () {
        var _r, _s;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        const mockedEvent = {
            threads: {
                values: [
                    {
                        stacktrace: {
                            frames: [
                                {
                                    platform: 'java',
                                    lineno: 2,
                                },
                                {
                                    lineno: 1,
                                },
                            ],
                        },
                    },
                ],
            },
        };
        const actualEvent = yield executeIntegrationFor(mockedEvent, {});
        expectMocksToBeCalledOnce();
        expect((_s = (_r = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _r === void 0 ? void 0 : _r.react_native_context) === null || _s === void 0 ? void 0 : _s.hermes_debug_info).toEqual(false);
    }));
    it('adds hermes_debug_info to react_native_context (no hermes bytecode frames found -> debug info present)', () => __awaiter(void 0, void 0, void 0, function* () {
        var _t, _u;
        mockedIsHermesEnabled = jest.fn().mockReturnValue(true);
        const mockedEvent = {
            threads: {
                values: [
                    {
                        stacktrace: {
                            frames: [
                                {
                                    platform: 'java',
                                    lineno: 2,
                                },
                                {
                                    lineno: 2,
                                },
                            ],
                        },
                    },
                ],
            },
        };
        const actualEvent = yield executeIntegrationFor(mockedEvent, {});
        expectMocksToBeCalledOnce();
        expect((_u = (_t = actualEvent === null || actualEvent === void 0 ? void 0 : actualEvent.contexts) === null || _t === void 0 ? void 0 : _t.react_native_context) === null || _u === void 0 ? void 0 : _u.hermes_debug_info).toEqual(true);
    }));
});
function expectMocksToBeCalledOnce() {
    expect(mockedIsHermesEnabled).toBeCalledTimes(1);
    expect(mockedIsTurboModuleEnabled).toBeCalledTimes(1);
    expect(mockedIsFabricEnabled).toBeCalledTimes(1);
}
function executeIntegrationFor(mockedEvent, mockedHint) {
    const integration = new ReactNativeInfo();
    return new Promise((resolve, reject) => {
        integration.setupOnce((eventProcessor) => __awaiter(this, void 0, void 0, function* () {
            try {
                const processedEvent = yield eventProcessor(mockedEvent, mockedHint);
                resolve(processedEvent);
            }
            catch (e) {
                reject(e);
            }
        }));
    });
}
