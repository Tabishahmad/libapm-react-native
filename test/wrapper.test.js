var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createEnvelope, logger } from '@sentry/utils';
import * as RN from 'react-native';
import { utf8ToBytes } from '../src/js/vendor';
import { NATIVE } from '../src/js/wrapper';
jest.mock('react-native', () => {
    let initPayload = null;
    const RNSentry = {
        addBreadcrumb: jest.fn(),
        captureEnvelope: jest.fn(),
        clearBreadcrumbs: jest.fn(),
        crash: jest.fn(),
        fetchNativeDeviceContexts: jest.fn(() => Promise.resolve({
            someContext: {
                someValue: 0,
            },
        })),
        fetchNativeRelease: jest.fn(() => Promise.resolve({
            build: '1.0.0.1',
            id: 'test-mock',
            version: '1.0.0',
        })),
        setContext: jest.fn(),
        setExtra: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(() => {
            return;
        }),
        initNativeSdk: jest.fn(options => {
            initPayload = options;
            return Promise.resolve(true);
        }),
        closeNativeSdk: jest.fn(() => Promise.resolve()),
        // @ts-expect-error for testing.
        _getLastPayload: () => ({ initPayload }),
        startProfiling: jest.fn(),
        stopProfiling: jest.fn(),
    };
    return {
        NativeModules: {
            RNSentry,
        },
        Platform: {
            OS: 'ios',
        },
    };
});
const RNSentry = RN.NativeModules.RNSentry;
const callAllScopeMethods = () => {
    NATIVE.addBreadcrumb({
        message: 'test',
        data: {
            map: { a: 1 },
            array: [1, 2, 3],
            unique: 123,
        },
    });
    NATIVE.clearBreadcrumbs();
    NATIVE.setUser({
        id: 'setUser',
    });
    NATIVE.setTag('key', 'value');
    NATIVE.setContext('key', {
        value: 'value',
        data: {
            map: { a: 1 },
            array: [1, 2, 3],
            unique: 123,
        },
    });
    NATIVE.setExtra('key', 'value');
};
describe('Tests Native Wrapper', () => {
    beforeEach(() => {
        NATIVE.platform = 'ios';
        NATIVE.enableNative = true;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('startWithOptions', () => {
        test('calls native module', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({ dsn: 'test', enableNative: true });
            expect(RNSentry.initNativeSdk).toBeCalled();
        }));
        test('warns if there is no dsn', () => __awaiter(void 0, void 0, void 0, function* () {
            logger.warn = jest.fn();
            yield NATIVE.initNativeSdk({ enableNative: true });
            expect(RNSentry.initNativeSdk).not.toBeCalled();
            expect(logger.warn).toHaveBeenLastCalledWith('Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initalized.');
        }));
        test('does not call native module with enableNative: false', () => __awaiter(void 0, void 0, void 0, function* () {
            logger.warn = jest.fn();
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: false,
                enableNativeNagger: true,
            });
            expect(RNSentry.initNativeSdk).not.toBeCalled();
            expect(NATIVE.enableNative).toBe(false);
            expect(logger.warn).toHaveBeenLastCalledWith('Note: Native Sentry SDK is disabled.');
        }));
        test('filter beforeSend when initializing Native SDK', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: true,
                autoInitializeNativeSdk: true,
                beforeSend: jest.fn(),
            });
            expect(RNSentry.initNativeSdk).toBeCalled();
            // @ts-expect-error mock value
            const initParameter = RNSentry.initNativeSdk.mock.calls[0][0];
            expect(initParameter).not.toHaveProperty('beforeSend');
            expect(NATIVE.enableNative).toBe(true);
        }));
        test('filter beforeBreadcrumb when initializing Native SDK', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: true,
                autoInitializeNativeSdk: true,
                beforeBreadcrumb: jest.fn(),
            });
            expect(RNSentry.initNativeSdk).toBeCalled();
            // @ts-expect-error mock value
            const initParameter = RNSentry.initNativeSdk.mock.calls[0][0];
            expect(initParameter).not.toHaveProperty('beforeBreadcrumb');
            expect(NATIVE.enableNative).toBe(true);
        }));
        test('filter beforeSendTransaction when initializing Native SDK', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: true,
                autoInitializeNativeSdk: true,
                beforeSendTransaction: jest.fn(),
            });
            expect(RNSentry.initNativeSdk).toBeCalled();
            // @ts-expect-error mock value
            const initParameter = RNSentry.initNativeSdk.mock.calls[0][0];
            expect(initParameter).not.toHaveProperty('beforeSendTransaction');
            expect(NATIVE.enableNative).toBe(true);
        }));
        test('filter integrations when initializing Native SDK', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: true,
                autoInitializeNativeSdk: true,
                integrations: [],
            });
            expect(RNSentry.initNativeSdk).toBeCalled();
            // @ts-expect-error mock value
            const initParameter = RNSentry.initNativeSdk.mock.calls[0][0];
            expect(initParameter).not.toHaveProperty('integrations');
            expect(NATIVE.enableNative).toBe(true);
        }));
        test('does not initialize with autoInitializeNativeSdk: false', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.enableNative = false;
            logger.warn = jest.fn();
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: true,
                autoInitializeNativeSdk: false,
            });
            expect(RNSentry.initNativeSdk).not.toBeCalled();
            expect(NATIVE.enableNative).toBe(true);
            // Test that native bridge methods will go through
            callAllScopeMethods();
            expect(RNSentry.addBreadcrumb).toBeCalledWith({
                message: 'test',
                data: {
                    map: { a: 1 },
                    array: [1, 2, 3],
                    unique: 123,
                },
            });
            expect(RNSentry.clearBreadcrumbs).toBeCalled();
            expect(RNSentry.setUser).toBeCalledWith({
                id: 'setUser',
            }, {});
            expect(RNSentry.setTag).toBeCalledWith('key', 'value');
            expect(RNSentry.setContext).toBeCalledWith('key', {
                value: 'value',
                data: {
                    map: { a: 1 },
                    array: [1, 2, 3],
                    unique: 123,
                },
            });
            expect(RNSentry.setExtra).toBeCalledWith('key', 'value');
        }));
        test('enableNative: false takes precedence over autoInitializeNativeSdk: false', () => __awaiter(void 0, void 0, void 0, function* () {
            logger.warn = jest.fn();
            yield NATIVE.initNativeSdk({
                dsn: 'test',
                enableNative: false,
                autoInitializeNativeSdk: false,
            });
            expect(RNSentry.initNativeSdk).not.toBeCalled();
            expect(NATIVE.enableNative).toBe(false);
            // Test that native bridge methods will NOT go through
            callAllScopeMethods();
            expect(RNSentry.addBreadcrumb).not.toBeCalled();
            expect(RNSentry.clearBreadcrumbs).not.toBeCalled();
            expect(RNSentry.setUser).not.toBeCalled();
            expect(RNSentry.setTag).not.toBeCalled();
            expect(RNSentry.setContext).not.toBeCalled();
            expect(RNSentry.setExtra).not.toBeCalled();
        }));
    });
    describe('sendEnvelope', () => {
        test('calls only captureEnvelope', () => __awaiter(void 0, void 0, void 0, function* () {
            const event = {
                event_id: 'event0',
                message: 'test',
                sdk: {
                    name: 'test-sdk-name',
                    version: '2.1.3',
                },
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":87}\n' +
                '{"event_id":"event0","message":"test","sdk":{"name":"test-sdk-name","version":"2.1.3"}}\n'), { store: false });
        }));
        test('serializes class instances', () => __awaiter(void 0, void 0, void 0, function* () {
            class TestInstance {
                constructor() {
                    this.value = 0;
                    this.method = () => null;
                }
            }
            const event = {
                event_id: 'event0',
                sdk: {
                    name: 'test-sdk-name',
                    version: '2.1.3',
                },
                instance: new TestInstance(),
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":93}\n' +
                '{"event_id":"event0","sdk":{"name":"test-sdk-name","version":"2.1.3"},"instance":{"value":0}}\n'), { store: false });
        }));
        test('does not call RNSentry at all if enableNative is false', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield NATIVE.initNativeSdk({ dsn: 'test-dsn', enableNative: false });
                // @ts-expect-error for testing, does not accept an empty class.
                yield NATIVE.sendEnvelope({});
            }
            catch (error) {
                // @ts-expect-error it is an error but it does not know the type.
                expect(error.message).toMatch('Native is disabled');
            }
            expect(RNSentry.captureEnvelope).not.toBeCalled();
        }));
        test('Encloses message to an object and not introduce empty breadcrumbs on Android', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'android';
            const event = {
                event_id: 'event0',
                message: 'test',
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":50}\n' +
                '{"event_id":"event0","message":{"message":"test"}}\n'), { store: false });
        }));
        test('Keeps breadcrumbs on Android if mechanism.handled is true', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'android';
            const event = {
                event_id: 'event0',
                exception: {
                    values: [
                        {
                            mechanism: {
                                handled: true,
                                type: '',
                            },
                        },
                    ],
                },
                breadcrumbs: [
                    {
                        message: 'crumb!',
                    },
                ],
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":124}\n' +
                '{"event_id":"event0","exception":{"values":[{"mechanism":{"handled":true,"type":""}}]},"breadcrumbs":[{"message":"crumb!"}]}\n'), { store: false });
        }));
        test('Keeps breadcrumbs on Android if there is no exception', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'android';
            const event = {
                event_id: 'event0',
                breadcrumbs: [
                    {
                        message: 'crumb!',
                    },
                ],
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":58}\n' +
                '{"event_id":"event0","breadcrumbs":[{"message":"crumb!"}]}\n'), { store: false });
        }));
        test('Keeps breadcrumbs on Android if mechanism.handled is false', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'android';
            const event = {
                event_id: 'event0',
                exception: {
                    values: [
                        {
                            mechanism: {
                                handled: false,
                                type: '',
                            },
                        },
                    ],
                },
                breadcrumbs: [
                    {
                        message: 'crumb!',
                    },
                ],
            };
            const env = createEnvelope({ event_id: event.event_id, sent_at: '123' }, [
                [{ type: 'event' }, event],
            ]);
            yield NATIVE.sendEnvelope(env);
            expect(RNSentry.captureEnvelope).toBeCalledWith(utf8ToBytes('{"event_id":"event0","sent_at":"123"}\n' +
                '{"type":"event","content_type":"application/json","length":125}\n' +
                '{"event_id":"event0","exception":{"values":[{"mechanism":{"handled":false,"type":""}}]},"breadcrumbs":[{"message":"crumb!"}]}\n'), { store: true });
        }));
    });
    describe('fetchRelease', () => {
        test('fetches the release from native', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(NATIVE.fetchNativeRelease()).resolves.toMatchObject({
                build: '1.0.0.1',
                id: 'test-mock',
                version: '1.0.0',
            });
        }));
    });
    describe('deviceContexts', () => {
        test('returns context object from native module on ios', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'ios';
            yield expect(NATIVE.fetchNativeDeviceContexts()).resolves.toMatchObject({
                someContext: {
                    someValue: 0,
                },
            });
            expect(RNSentry.fetchNativeDeviceContexts).toBeCalled();
        }));
        test('returns context object from native module on android', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.platform = 'android';
            yield expect(NATIVE.fetchNativeDeviceContexts()).resolves.toMatchObject({
                someContext: {
                    someValue: 0,
                },
            });
            expect(RNSentry.fetchNativeDeviceContexts).toBeCalled();
        }));
    });
    describe('isModuleLoaded', () => {
        test('returns true when module is loaded', () => {
            expect(NATIVE._isModuleLoaded(RNSentry)).toBe(true);
        });
    });
    describe('crash', () => {
        test('calls the native crash', () => {
            NATIVE.nativeCrash();
            expect(RNSentry.crash).toBeCalled();
        });
        test('does not call crash if enableNative is false', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.initNativeSdk({ dsn: 'test-dsn', enableNative: false });
            NATIVE.nativeCrash();
            expect(RNSentry.crash).not.toBeCalled();
        }));
    });
    describe('setUser', () => {
        test('serializes all user object keys', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.setUser({
                email: 'hello@sentry.io',
                // @ts-expect-error Intentional incorrect type to simulate using a double as an id (We had a user open an issue because this didn't work before)
                id: 3.14159265359,
                unique: 123,
            });
            expect(RNSentry.setUser).toBeCalledWith({
                email: 'hello@sentry.io',
                id: '3.14159265359',
            }, {
                unique: '123',
            });
        }));
        test('Calls native setUser with empty object as second param if no unique keys', () => __awaiter(void 0, void 0, void 0, function* () {
            NATIVE.setUser({
                id: 'Hello',
            });
            expect(RNSentry.setUser).toBeCalledWith({
                id: 'Hello',
            }, {});
        }));
    });
    describe('_processLevel', () => {
        test('converts deprecated levels', () => {
            expect(NATIVE._processLevel('log')).toBe('debug');
        });
        test('returns non-deprecated levels', () => {
            expect(NATIVE._processLevel('debug')).toBe('debug');
            expect(NATIVE._processLevel('fatal')).toBe('fatal');
            expect(NATIVE._processLevel('info')).toBe('info');
            expect(NATIVE._processLevel('warning')).toBe('warning');
            expect(NATIVE._processLevel('error')).toBe('error');
        });
    });
    describe('closeNativeSdk', () => {
        NATIVE.enableNative = true;
        test('closeNativeSdk calls native bridge', () => __awaiter(void 0, void 0, void 0, function* () {
            yield NATIVE.closeNativeSdk();
            expect(RNSentry.closeNativeSdk).toBeCalled();
            expect(NATIVE.enableNative).toBe(false);
        }));
    });
    describe('profiling', () => {
        test('start profiling returns true', () => {
            RNSentry.startProfiling.mockReturnValue({
                started: true,
            });
            expect(NATIVE.startProfiling()).toBe(true);
        });
        test('failed start profiling returns false', () => {
            RNSentry.startProfiling.mockReturnValue({
                error: 'error',
            });
            expect(NATIVE.startProfiling()).toBe(false);
        });
        test('stop profiling returns hermes profile', () => {
            RNSentry.stopProfiling.mockReturnValue({
                profile: '{ "valid": "hermes" }',
            });
            expect(NATIVE.stopProfiling()).toEqual({
                hermesProfile: { valid: 'hermes' },
            });
        });
        test('stop profiling returns hermes and native profiles', () => {
            RNSentry.stopProfiling.mockReturnValue({
                profile: '{ "valid": "hermes" }',
                nativeProfile: { valid: 'native' },
            });
            expect(NATIVE.stopProfiling()).toEqual({
                hermesProfile: { valid: 'hermes' },
                nativeProfile: { valid: 'native' },
            });
        });
        test('failed stop profiling returns null', () => {
            RNSentry.stopProfiling.mockReturnValue({
                error: 'error',
            });
            expect(NATIVE.stopProfiling()).toBe(null);
        });
        test('stop profiling returns null on invalid json profile', () => {
            RNSentry.stopProfiling.mockReturnValue({
                profile: 'invalid',
            });
            expect(NATIVE.stopProfiling()).toBe(null);
        });
    });
});
