var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import { Release } from '../../src/js/integrations/release';
const mockRelease = Release;
jest.mock('@sentry/core', () => {
    const client = {
        getOptions: jest.fn(),
    };
    const hub = {
        getClient: () => client,
        // out-of-scope variables have to be prefixed with `mock` caseSensitive
        getIntegration: () => mockRelease,
    };
    return {
        addGlobalEventProcessor: jest.fn(),
        getCurrentHub: () => hub,
    };
});
jest.mock('../../src/js/wrapper', () => ({
    NATIVE: {
        fetchNativeRelease: () => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                build: 'native_build',
                id: 'native_id',
                version: 'native_version',
            });
        }),
    },
}));
describe('Tests the Release integration', () => {
    test('Uses release from native SDK if release/dist are not present in options.', () => __awaiter(void 0, void 0, void 0, function* () {
        const releaseIntegration = new Release();
        let eventProcessor = () => null;
        // @ts-expect-error Mock
        addGlobalEventProcessor.mockImplementation(e => (eventProcessor = e));
        releaseIntegration.setupOnce();
        expect(addGlobalEventProcessor).toBeCalled();
        const client = getCurrentHub().getClient();
        // @ts-expect-error Mock
        client.getOptions.mockImplementation(() => ({}));
        const event = yield eventProcessor({}, {});
        expect(event === null || event === void 0 ? void 0 : event.release).toBe('native_id@native_version+native_build');
        expect(event === null || event === void 0 ? void 0 : event.dist).toBe('native_build');
    }));
    test('Uses release from native SDK if release is not present in options.', () => __awaiter(void 0, void 0, void 0, function* () {
        const releaseIntegration = new Release();
        let eventProcessor = () => null;
        // @ts-expect-error Mock
        addGlobalEventProcessor.mockImplementation(e => (eventProcessor = e));
        releaseIntegration.setupOnce();
        const client = getCurrentHub().getClient();
        // @ts-expect-error Mock
        client.getOptions.mockImplementation(() => ({
            dist: 'options_dist',
        }));
        const event = yield eventProcessor({}, {});
        expect(event === null || event === void 0 ? void 0 : event.release).toBe('native_id@native_version+native_build');
        expect(event === null || event === void 0 ? void 0 : event.dist).toBe('options_dist');
    }));
    test('Uses dist from native SDK if dist is not present in options.', () => __awaiter(void 0, void 0, void 0, function* () {
        const releaseIntegration = new Release();
        let eventProcessor = () => null;
        // @ts-expect-error Mock
        addGlobalEventProcessor.mockImplementation(e => (eventProcessor = e));
        releaseIntegration.setupOnce();
        const client = getCurrentHub().getClient();
        // @ts-expect-error Mock
        client.getOptions.mockImplementation(() => ({
            release: 'options_release',
        }));
        const event = yield eventProcessor({}, {});
        expect(event === null || event === void 0 ? void 0 : event.release).toBe('options_release');
        expect(event === null || event === void 0 ? void 0 : event.dist).toBe('native_build');
    }));
    test('Uses release and dist from options', () => __awaiter(void 0, void 0, void 0, function* () {
        const releaseIntegration = new Release();
        let eventProcessor = () => null;
        // @ts-expect-error Mock
        addGlobalEventProcessor.mockImplementation(e => (eventProcessor = e));
        releaseIntegration.setupOnce();
        expect(addGlobalEventProcessor).toBeCalled();
        const client = getCurrentHub().getClient();
        // @ts-expect-error Mock
        client.getOptions.mockImplementation(() => ({
            dist: 'options_dist',
            release: 'options_release',
        }));
        const event = yield eventProcessor({}, {});
        expect(event === null || event === void 0 ? void 0 : event.release).toBe('options_release');
        expect(event === null || event === void 0 ? void 0 : event.dist).toBe('options_dist');
    }));
    test('Uses __sentry_release and __sentry_dist over everything else.', () => __awaiter(void 0, void 0, void 0, function* () {
        const releaseIntegration = new Release();
        let eventProcessor = () => null;
        // @ts-expect-error Mock
        addGlobalEventProcessor.mockImplementation(e => (eventProcessor = e));
        releaseIntegration.setupOnce();
        expect(addGlobalEventProcessor).toBeCalled();
        const client = getCurrentHub().getClient();
        // @ts-expect-error Mock
        client.getOptions.mockImplementation(() => ({
            dist: 'options_dist',
            release: 'options_release',
        }));
        const event = yield eventProcessor({
            extra: {
                __sentry_dist: 'sentry_dist',
                __sentry_release: 'sentry_release',
            },
        }, {});
        expect(event === null || event === void 0 ? void 0 : event.release).toBe('sentry_release');
        expect(event === null || event === void 0 ? void 0 : event.dist).toBe('sentry_dist');
    }));
});
