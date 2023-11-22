var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BrowserClient, defaultIntegrations, defaultStackParser } from '@sentry/browser';
const mockBrowserClient = new BrowserClient({
    stackParser: defaultStackParser,
    integrations: defaultIntegrations,
    transport: jest.fn(),
});
jest.mock('@sentry/core', () => {
    const core = jest.requireActual('@sentry/core');
    const scope = {
        getAttachments: jest.fn(),
    };
    const client = {
        getOptions: () => ({}),
        eventFromException: (_exception, _hint) => mockBrowserClient.eventFromException(_exception, _hint),
    };
    const hub = {
        getClient: () => client,
        getScope: () => scope,
        captureEvent: jest.fn(),
    };
    return Object.assign(Object.assign({}, core), { addGlobalEventProcessor: jest.fn(), getCurrentHub: () => hub });
});
jest.mock('@sentry/utils', () => {
    const utils = jest.requireActual('@sentry/utils');
    return Object.assign(Object.assign({}, utils), { logger: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } });
});
import { getCurrentHub } from '@sentry/core';
import { ReactNativeErrorHandlers } from '../../src/js/integrations/reactnativeerrorhandlers';
describe('ReactNativeErrorHandlers', () => {
    beforeEach(() => {
        ErrorUtils.getGlobalHandler = () => jest.fn();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('onError', () => {
        let errorHandlerCallback;
        beforeEach(() => {
            errorHandlerCallback = () => Promise.resolve();
            ErrorUtils.setGlobalHandler = jest.fn(_callback => {
                errorHandlerCallback = _callback;
            });
            const integration = new ReactNativeErrorHandlers();
            integration.setupOnce();
            expect(ErrorUtils.setGlobalHandler).toHaveBeenCalledWith(errorHandlerCallback);
        });
        test('Sets handled:false on a fatal error', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            yield errorHandlerCallback(new Error('Test Error'), true);
            const [event] = getActualCaptureEventArgs();
            expect(event.level).toBe('fatal');
            expect((_c = (_b = (_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b[0].mechanism) === null || _c === void 0 ? void 0 : _c.handled).toBe(false);
            expect((_f = (_e = (_d = event.exception) === null || _d === void 0 ? void 0 : _d.values) === null || _e === void 0 ? void 0 : _e[0].mechanism) === null || _f === void 0 ? void 0 : _f.type).toBe('onerror');
        }));
        test('Does not set handled:false on a non-fatal error', () => __awaiter(void 0, void 0, void 0, function* () {
            var _g, _h, _j, _k, _l, _m;
            yield errorHandlerCallback(new Error('Test Error'), false);
            const [event] = getActualCaptureEventArgs();
            expect(event.level).toBe('error');
            expect((_j = (_h = (_g = event.exception) === null || _g === void 0 ? void 0 : _g.values) === null || _h === void 0 ? void 0 : _h[0].mechanism) === null || _j === void 0 ? void 0 : _j.handled).toBe(true);
            expect((_m = (_l = (_k = event.exception) === null || _k === void 0 ? void 0 : _k.values) === null || _l === void 0 ? void 0 : _l[0].mechanism) === null || _m === void 0 ? void 0 : _m.type).toBe('generic');
        }));
        test('Includes original exception in hint', () => __awaiter(void 0, void 0, void 0, function* () {
            yield errorHandlerCallback(new Error('Test Error'), false);
            const [, hint] = getActualCaptureEventArgs();
            expect(hint).toEqual(expect.objectContaining({ originalException: new Error('Test Error') }));
        }));
    });
});
function getActualCaptureEventArgs() {
    const hub = getCurrentHub();
    const mockCall = hub.captureEvent.mock.calls[0];
    return mockCall;
}
