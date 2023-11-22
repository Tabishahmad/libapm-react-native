var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @jest-environment jsdom
 */
import { logger } from '@sentry/utils';
import { NATIVE } from '../src/js/wrapper';
let mockedGetCurrentHubWithScope;
let mockedGetCurrentHubConfigureScope;
jest.mock('@sentry/react', () => {
    const actualModule = jest.requireActual('@sentry/react');
    const mockClient = {
        flush: jest.fn(() => Promise.resolve(true)),
    };
    return Object.assign(Object.assign({}, actualModule), { getCurrentHub: jest.fn(() => {
            mockedGetCurrentHubWithScope = jest.fn();
            mockedGetCurrentHubConfigureScope = jest.fn();
            return {
                getClient: jest.fn(() => mockClient),
                setTag: jest.fn(),
                withScope: mockedGetCurrentHubWithScope,
                configureScope: mockedGetCurrentHubConfigureScope,
            };
        }), defaultIntegrations: [{ name: 'MockedDefaultReactIntegration', setupOnce: jest.fn() }] });
});
jest.mock('@sentry/core', () => {
    const originalCore = jest.requireActual('@sentry/core');
    return Object.assign(Object.assign({}, originalCore), { initAndBind: jest.fn() });
});
jest.mock('@sentry/hub', () => {
    const originalHub = jest.requireActual('@sentry/hub');
    return Object.assign(Object.assign({}, originalHub), { makeMain: jest.fn() });
});
jest.mock('../src/js/scope', () => {
    return {
        ReactNativeScope: class ReactNativeScopeMock {
        },
    };
});
jest.mock('../src/js/client', () => {
    return {
        ReactNativeClient: class ReactNativeClientMock {
        },
    };
});
jest.mock('../src/js/wrapper');
jest.spyOn(logger, 'error');
import { initAndBind } from '@sentry/core';
import { getCurrentHub, makeFetchTransport } from '@sentry/react';
import { configureScope, flush, init, withScope } from '../src/js/sdk';
import { ReactNativeTracing, ReactNavigationInstrumentation } from '../src/js/tracing';
import { makeNativeTransport } from '../src/js/transports/native';
import { firstArg, secondArg } from './testutils';
const mockedInitAndBind = initAndBind;
const usedOptions = () => {
    var _a;
    return (_a = mockedInitAndBind.mock.calls[0]) === null || _a === void 0 ? void 0 : _a[1];
};
describe('Tests the SDK functionality', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('init', () => {
        describe('enableAutoPerformanceTracing', () => {
            const usedOptions = () => {
                const mockCall = mockedInitAndBind.mock.calls[0];
                if (mockCall) {
                    const options = mockCall[1];
                    return options.integrations;
                }
                return [];
            };
            const autoPerformanceIsEnabled = () => {
                return usedOptions().some(integration => integration.name === ReactNativeTracing.id);
            };
            const reactNavigationInstrumentation = () => {
                const nav = new ReactNavigationInstrumentation();
                return new ReactNativeTracing({ routingInstrumentation: nav });
            };
            it('Auto Performance is enabled when tracing is enabled (tracesSampler)', () => {
                init({
                    tracesSampler: () => true,
                    enableAutoPerformanceTracing: true,
                });
                expect(autoPerformanceIsEnabled()).toBe(true);
            });
            it('Auto Performance is enabled when tracing is enabled (tracesSampleRate)', () => {
                init({
                    tracesSampleRate: 0.5,
                    enableAutoPerformanceTracing: true,
                });
                expect(autoPerformanceIsEnabled()).toBe(true);
            });
            it('Do not overwrite user defined integrations when passing integrations', () => {
                const tracing = reactNavigationInstrumentation();
                init({
                    tracesSampleRate: 0.5,
                    enableAutoPerformanceTracing: true,
                    integrations: [tracing],
                });
                const options = usedOptions();
                expect(options.filter(integration => integration.name === ReactNativeTracing.id).length).toBe(1);
                expect(options.some(integration => integration === tracing)).toBe(true);
            });
            it('Do not overwrite user defined integrations when passing defaultIntegrations', () => {
                const tracing = reactNavigationInstrumentation();
                init({
                    tracesSampleRate: 0.5,
                    enableAutoPerformanceTracing: true,
                    defaultIntegrations: [tracing],
                });
                const options = usedOptions();
                expect(options.filter(integration => integration.name === ReactNativeTracing.id).length).toBe(1);
                expect(options.some(integration => integration === tracing)).toBe(true);
            });
        });
        describe('flush', () => {
            it('Calls flush on the client', () => __awaiter(void 0, void 0, void 0, function* () {
                const mockClient = getMockClient();
                expect(mockClient).toBeTruthy();
                if (mockClient) {
                    const flushResult = yield flush();
                    expect(mockClient.flush).toBeCalled();
                    expect(flushResult).toBe(true);
                }
            }));
            it('Returns false if flush failed and logs error', () => __awaiter(void 0, void 0, void 0, function* () {
                const mockClient = getMockClient();
                expect(mockClient).toBeTruthy();
                if (mockClient) {
                    mockClient.flush = jest.fn(() => Promise.reject());
                    const flushResult = yield flush();
                    expect(mockClient.flush).toBeCalled();
                    expect(flushResult).toBe(false);
                    expect(logger.error).toBeCalledWith('Failed to flush the event queue.');
                }
            }));
        });
        describe('environment', () => {
            it('detect development environment', () => {
                var _a;
                init({
                    enableNative: true,
                });
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.environment).toBe('development');
            });
            it('uses custom environment', () => {
                var _a;
                init({
                    environment: 'custom',
                });
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.environment).toBe('custom');
            });
            it('it keeps empty string environment', () => {
                var _a;
                init({
                    environment: '',
                });
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.environment).toBe('');
            });
            it('it keeps undefined environment', () => {
                var _a;
                init({
                    environment: undefined,
                });
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.environment).toBe(undefined);
            });
        });
        describe('transport options buffer size', () => {
            it('uses default transport options buffer size', () => {
                var _a, _b;
                init({
                    tracesSampleRate: 0.5,
                    enableAutoPerformanceTracing: true,
                });
                expect((_b = (_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transportOptions) === null || _b === void 0 ? void 0 : _b.bufferSize).toBe(30);
            });
            it('uses custom transport options buffer size', () => {
                var _a, _b;
                init({
                    transportOptions: {
                        bufferSize: 99,
                    },
                });
                expect((_b = (_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transportOptions) === null || _b === void 0 ? void 0 : _b.bufferSize).toBe(99);
            });
            it('uses max queue size', () => {
                var _a, _b;
                init({
                    maxQueueSize: 88,
                });
                expect((_b = (_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transportOptions) === null || _b === void 0 ? void 0 : _b.bufferSize).toBe(88);
            });
        });
    });
    describe('transport initialization', () => {
        describe('native SDK unavailable', () => {
            it('fetchTransport set and enableNative set to false', () => {
                var _a, _b;
                NATIVE.isNativeAvailable.mockImplementation(() => false);
                init({});
                expect(NATIVE.isNativeAvailable).toBeCalled();
                // @ts-expect-error enableNative not publicly available here.
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.enableNative).toEqual(false);
                expect((_b = usedOptions()) === null || _b === void 0 ? void 0 : _b.transport).toEqual(makeFetchTransport);
            });
            it('fetchTransport set and passed enableNative ignored when true', () => {
                var _a, _b;
                NATIVE.isNativeAvailable.mockImplementation(() => false);
                init({ enableNative: true });
                expect(NATIVE.isNativeAvailable).toBeCalled();
                // @ts-expect-error enableNative not publicly available here.
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.enableNative).toEqual(false);
                expect((_b = usedOptions()) === null || _b === void 0 ? void 0 : _b.transport).toEqual(makeFetchTransport);
            });
            it('fetchTransport set and isNativeAvailable not called when passed enableNative set to false', () => {
                var _a, _b;
                NATIVE.isNativeAvailable.mockImplementation(() => false);
                init({ enableNative: false });
                expect(NATIVE.isNativeAvailable).not.toBeCalled();
                // @ts-expect-error enableNative not publicly available here.
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.enableNative).toEqual(false);
                expect((_b = usedOptions()) === null || _b === void 0 ? void 0 : _b.transport).toEqual(makeFetchTransport);
            });
            it('custom transport set and enableNative set to false', () => {
                var _a, _b;
                NATIVE.isNativeAvailable.mockImplementation(() => false);
                const mockTransport = jest.fn();
                init({
                    transport: mockTransport,
                });
                expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(mockTransport);
                expect(NATIVE.isNativeAvailable).toBeCalled();
                // @ts-expect-error enableNative not publicly available here.
                expect((_b = usedOptions()) === null || _b === void 0 ? void 0 : _b.enableNative).toEqual(false);
            });
        });
        it('uses transport from the options', () => {
            var _a;
            const mockTransport = jest.fn();
            init({
                transport: mockTransport,
            });
            expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(mockTransport);
        });
        it('uses native transport', () => {
            var _a;
            NATIVE.isNativeAvailable.mockImplementation(() => true);
            init({});
            expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(makeNativeTransport);
        });
        it('uses fallback fetch transport', () => {
            var _a;
            NATIVE.isNativeAvailable.mockImplementation(() => false);
            init({});
            expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(makeFetchTransport);
        });
        it('checks sdk options first', () => {
            var _a;
            NATIVE.isNativeAvailable.mockImplementation(() => true);
            init({ enableNative: false });
            expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(makeFetchTransport);
            expect(NATIVE.isNativeAvailable).not.toBeCalled();
        });
        it('check both options and native availability', () => {
            var _a;
            NATIVE.isNativeAvailable.mockImplementation(() => true);
            init({ enableNative: true });
            expect((_a = usedOptions()) === null || _a === void 0 ? void 0 : _a.transport).toEqual(makeNativeTransport);
            expect(NATIVE.isNativeAvailable).toBeCalled();
        });
    });
    describe('initIsSafe', () => {
        test('initialScope callback is safe after init', () => {
            const mockInitialScope = jest.fn(() => {
                throw 'Test error';
            });
            init({ initialScope: mockInitialScope });
            expect(() => {
                mockedInitAndBind.mock.calls[0][secondArg].initialScope({});
            }).not.toThrow();
            expect(mockInitialScope).toBeCalledTimes(1);
        });
        test('beforeBreadcrumb callback is safe after init', () => {
            const mockBeforeBreadcrumb = jest.fn(() => {
                throw 'Test error';
            });
            init({ beforeBreadcrumb: mockBeforeBreadcrumb });
            expect(() => {
                var _a, _b;
                (_b = (_a = mockedInitAndBind.mock.calls[0][secondArg]).beforeBreadcrumb) === null || _b === void 0 ? void 0 : _b.call(_a, {});
            }).not.toThrow();
            expect(mockBeforeBreadcrumb).toBeCalledTimes(1);
        });
        test('integrations callback should not crash init', () => {
            const mockIntegrations = jest.fn(() => {
                throw 'Test error';
            });
            expect(() => {
                init({ integrations: mockIntegrations });
            }).not.toThrow();
            expect(mockIntegrations).toBeCalledTimes(1);
        });
        test('tracesSampler callback is safe after init', () => {
            const mockTraceSampler = jest.fn(() => {
                throw 'Test error';
            });
            init({ tracesSampler: mockTraceSampler });
            expect(() => {
                var _a, _b;
                (_b = (_a = mockedInitAndBind.mock.calls[0][secondArg]).tracesSampler) === null || _b === void 0 ? void 0 : _b.call(_a, {});
            }).not.toThrow();
            expect(mockTraceSampler).toBeCalledTimes(1);
        });
    });
    describe('withScope', () => {
        test('withScope callback does not throw', () => {
            const mockScopeCallback = jest.fn(() => {
                throw 'Test error';
            });
            withScope(mockScopeCallback);
            expect(() => {
                mockedGetCurrentHubWithScope.mock.calls[0][firstArg]({});
            }).not.toThrow();
            expect(mockScopeCallback).toBeCalledTimes(1);
        });
    });
    describe('configureScope', () => {
        test('configureScope callback does not throw', () => {
            const mockScopeCallback = jest.fn(() => {
                throw 'Test error';
            });
            configureScope(mockScopeCallback);
            expect(() => {
                mockedGetCurrentHubConfigureScope.mock.calls[0][firstArg]({});
            }).not.toThrow();
            expect(mockScopeCallback).toBeCalledTimes(1);
        });
    });
    describe('integrations', () => {
        it('replaces default integrations', () => {
            const mockDefaultIntegration = getMockedIntegration();
            init({
                defaultIntegrations: [mockDefaultIntegration],
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual([mockDefaultIntegration]);
        });
        it('no http client integration by default', () => {
            init({});
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'HttpClient' })]));
        });
        it('adds http client integration', () => {
            init({
                enableCaptureFailedRequests: true,
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'HttpClient' })]));
        });
        it('user defined http client integration overwrites default', () => {
            init({
                enableCaptureFailedRequests: true,
                integrations: [
                    {
                        name: 'HttpClient',
                        setupOnce: () => { },
                        isUserDefined: true,
                    },
                ],
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    name: 'HttpClient',
                    isUserDefined: true,
                }),
            ]));
            expect(actualIntegrations.filter(integration => integration.name === 'HttpClient')).toHaveLength(1);
        });
        it('no screenshot integration by default', () => {
            init({});
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'Screenshot' })]));
        });
        it('adds screenshot integration', () => {
            init({
                attachScreenshot: true,
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Screenshot' })]));
        });
        it('no view hierarchy integration by default', () => {
            init({});
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'ViewHierarchy' })]));
        });
        it('adds view hierarchy integration', () => {
            init({
                attachViewHierarchy: true,
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'ViewHierarchy' })]));
        });
        it('no profiling integration by default', () => {
            init({});
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'HermesProfiling' })]));
        });
        it('adds profiling integration', () => {
            init({
                _experiments: {
                    profilesSampleRate: 0.7,
                },
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'HermesProfiling' })]));
        });
        it('no default integrations', () => {
            init({
                defaultIntegrations: false,
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual([]);
        });
        it('merges with passed default integrations', () => {
            const mockIntegration = getMockedIntegration();
            const mockDefaultIntegration = getMockedIntegration({ name: 'MockedDefaultIntegration' });
            init({
                integrations: [mockIntegration],
                defaultIntegrations: [mockDefaultIntegration],
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([mockIntegration, mockDefaultIntegration])); // order doesn't matter
            expect(actualIntegrations.length).toBe(2); // there should be no extra unexpected integrations
        });
        it('merges with default integrations', () => {
            const mockIntegration = getMockedIntegration();
            init({
                integrations: [mockIntegration],
            });
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([mockIntegration]));
            expect(actualIntegrations.length).toBeGreaterThan(1); // there should be default integrations + the test one
        });
        it('passes default integrations to the function', () => {
            const mockIntegration = getMockedIntegration();
            const mockIntegrationFactory = jest.fn((_integrations) => [mockIntegration]);
            init({
                integrations: mockIntegrationFactory,
            });
            const actualPassedIntegrations = mockIntegrationFactory.mock.calls[0][firstArg];
            expect(actualPassedIntegrations.length).toBeGreaterThan(0);
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual([mockIntegration]);
        });
        it('passes custom default integrations to the function', () => {
            const mockIntegration = getMockedIntegration();
            const mockDefaultIntegration = getMockedIntegration({ name: 'MockedDefaultIntegration' });
            const mockIntegrationFactory = jest.fn((_integrations) => [mockIntegration]);
            init({
                integrations: mockIntegrationFactory,
                defaultIntegrations: [mockDefaultIntegration],
            });
            const actualPassedIntegrations = mockIntegrationFactory.mock.calls[0][firstArg];
            expect(actualPassedIntegrations).toEqual([mockDefaultIntegration]);
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual([mockIntegration]);
        });
        it('passes no defaults to the function', () => {
            const mockIntegrationFactory = jest.fn((_integrations) => []);
            init({
                integrations: mockIntegrationFactory,
                defaultIntegrations: false,
            });
            const actualPassedIntegrations = mockIntegrationFactory.mock.calls[0][firstArg];
            expect(actualPassedIntegrations).toEqual([]);
        });
        it('adds react default integrations', () => {
            init({});
            const actualOptions = mockedInitAndBind.mock.calls[0][secondArg];
            const actualIntegrations = actualOptions.integrations;
            expect(actualIntegrations).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'MockedDefaultReactIntegration' })]));
        });
    });
});
function getMockClient() {
    const mockClient = getCurrentHub().getClient();
    return mockClient;
}
function getMockedIntegration({ name } = {}) {
    return {
        name: name !== null && name !== void 0 ? name : 'MockedIntegration',
        setupOnce: jest.fn(),
    };
}
