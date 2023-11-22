var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as SentryBrowser from '@sentry/browser';
import { addGlobalEventProcessor, Hub, Transaction } from '@sentry/core';
import { RoutingInstrumentation } from '../../src/js/tracing/routingInstrumentation';
const BrowserClient = SentryBrowser.BrowserClient;
jest.mock('../../src/js/wrapper', () => {
    return {
        NATIVE: {
            fetchNativeAppStart: jest.fn(),
            fetchNativeFrames: jest.fn(() => Promise.resolve()),
            disableNativeFramesTracking: jest.fn(() => Promise.resolve()),
            enableNativeFramesTracking: jest.fn(() => Promise.resolve()),
            enableNative: true,
        },
    };
});
jest.mock('../../src/js/tracing/utils', () => {
    const originalUtils = jest.requireActual('../../src/js/tracing/utils');
    return Object.assign(Object.assign({}, originalUtils), { getTimeOriginMilliseconds: jest.fn() });
});
const mockedAppState = {
    removeSubscription: jest.fn(),
    listener: jest.fn(),
    isAvailable: true,
    currentState: 'active',
    addEventListener: (_, listener) => {
        mockedAppState.listener = listener;
        return {
            remove: mockedAppState.removeSubscription,
        };
    },
    setState: (state) => {
        mockedAppState.currentState = state;
        mockedAppState.listener(state);
    },
};
jest.mock('react-native/Libraries/AppState/AppState', () => mockedAppState);
const getMockScope = () => {
    let scopeTransaction;
    let scopeUser;
    return {
        getTransaction: () => scopeTransaction,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSpan: jest.fn((span) => {
            scopeTransaction = span;
        }),
        setTag(_tag) {
            // Placeholder
        },
        setContext(_context) {
            // Placeholder
        },
        addBreadcrumb(_breadcrumb) {
            // Placeholder
        },
        getUser: () => scopeUser,
    };
};
const getMockHub = () => {
    const mockHub = new Hub(new BrowserClient({
        tracesSampleRate: 1,
        integrations: [],
        transport: () => ({
            send: jest.fn(),
            flush: jest.fn(),
        }),
        stackParser: () => [],
    }));
    const mockScope = getMockScope();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHub.getScope = () => mockScope;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHub.configureScope = jest.fn(callback => callback(mockScope));
    return mockHub;
};
import { APP_START_COLD, APP_START_WARM } from '../../src/js/measurements';
import { APP_START_COLD as APP_START_COLD_OP, APP_START_WARM as APP_START_WARM_OP, UI_LOAD, } from '../../src/js/tracing';
import { APP_START_WARM as APP_SPAN_START_WARM } from '../../src/js/tracing/ops';
import { ReactNativeTracing } from '../../src/js/tracing/reactnativetracing';
import { getTimeOriginMilliseconds } from '../../src/js/tracing/utils';
import { NATIVE } from '../../src/js/wrapper';
import { firstArg, mockFunction } from '../testutils';
import { createMockedRoutingInstrumentation, mockedConfirmedRouteTransactionContext, } from './mockedrountinginstrumention';
const DEFAULT_IDLE_TIMEOUT = 1000;
describe('ReactNativeTracing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        NATIVE.enableNative = true;
    });
    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });
    describe('trace propagation targets', () => {
        it('uses tracingOrigins', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({}),
                }),
            };
            const integration = new ReactNativeTracing({
                tracingOrigins: ['test1', 'test2'],
            });
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['test1', 'test2'],
            }));
        });
        it('uses tracePropagationTargets', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({}),
                }),
            };
            const integration = new ReactNativeTracing({
                tracePropagationTargets: ['test1', 'test2'],
            });
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['test1', 'test2'],
            }));
        });
        it('uses tracePropagationTargets from client options', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({
                        tracePropagationTargets: ['test1', 'test2'],
                    }),
                }),
            };
            const integration = new ReactNativeTracing({});
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['test1', 'test2'],
            }));
        });
        it('uses defaults', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({}),
                }),
            };
            const integration = new ReactNativeTracing({});
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['localhost', /^\/(?!\/)/],
            }));
        });
        it('client tracePropagationTargets takes priority over integration options', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({
                        tracePropagationTargets: ['test1', 'test2'],
                    }),
                }),
            };
            const integration = new ReactNativeTracing({
                tracePropagationTargets: ['test3', 'test4'],
                tracingOrigins: ['test5', 'test6'],
            });
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['test1', 'test2'],
            }));
        });
        it('integration tracePropagationTargets takes priority over tracingOrigins', () => {
            const instrumentOutgoingRequests = jest.spyOn(SentryBrowser, 'instrumentOutgoingRequests');
            const mockedHub = {
                getClient: () => ({
                    getOptions: () => ({}),
                }),
            };
            const integration = new ReactNativeTracing({
                tracePropagationTargets: ['test3', 'test4'],
                tracingOrigins: ['test5', 'test6'],
            });
            integration.setupOnce(() => { }, () => mockedHub);
            expect(instrumentOutgoingRequests).toBeCalledWith(expect.objectContaining({
                tracePropagationTargets: ['test3', 'test4'],
            }));
        });
    });
    describe('App Start', () => {
        describe('Without routing instrumentation', () => {
            it('Starts route transaction (cold)', () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const integration = new ReactNativeTracing({
                    enableNativeFramesTracking: false,
                });
                const [timeOriginMilliseconds, appStartTimeMilliseconds] = mockAppStartResponse({ cold: true });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                integration.onAppStartFinish(Date.now() / 1000);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_a = mockHub.getScope()) === null || _a === void 0 ? void 0 : _a.getTransaction();
                expect(transaction).toBeDefined();
                if (transaction) {
                    expect(transaction.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                    expect(transaction.op).toBe(UI_LOAD);
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_COLD].value).toEqual(timeOriginMilliseconds - appStartTimeMilliseconds);
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_COLD].unit).toBe('millisecond');
                }
            }));
            it('Starts route transaction (warm)', () => __awaiter(void 0, void 0, void 0, function* () {
                var _b;
                const integration = new ReactNativeTracing();
                const [timeOriginMilliseconds, appStartTimeMilliseconds] = mockAppStartResponse({ cold: false });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_b = mockHub.getScope()) === null || _b === void 0 ? void 0 : _b.getTransaction();
                expect(transaction).toBeDefined();
                if (transaction) {
                    expect(transaction.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                    expect(transaction.op).toBe(UI_LOAD);
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_WARM].value).toEqual(timeOriginMilliseconds - appStartTimeMilliseconds);
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_WARM].unit).toBe('millisecond');
                }
            }));
            it('Cancels route transaction when app goes to background', () => __awaiter(void 0, void 0, void 0, function* () {
                var _c;
                const integration = new ReactNativeTracing();
                mockAppStartResponse({ cold: false });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_c = mockHub.getScope()) === null || _c === void 0 ? void 0 : _c.getTransaction();
                mockedAppState.setState('background');
                jest.runAllTimers();
                expect(transaction === null || transaction === void 0 ? void 0 : transaction.status).toBe('cancelled');
                expect(mockedAppState.removeSubscription).toBeCalledTimes(1);
            }));
            it('Does not add app start measurement if more than 60s', () => __awaiter(void 0, void 0, void 0, function* () {
                var _d;
                const integration = new ReactNativeTracing();
                const timeOriginMilliseconds = Date.now();
                const appStartTimeMilliseconds = timeOriginMilliseconds - 65000;
                const mockAppStartResponse = {
                    isColdStart: false,
                    appStartTime: appStartTimeMilliseconds,
                    didFetchAppStart: false,
                };
                mockFunction(getTimeOriginMilliseconds).mockReturnValue(timeOriginMilliseconds);
                mockFunction(NATIVE.fetchNativeAppStart).mockResolvedValue(mockAppStartResponse);
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_d = mockHub.getScope()) === null || _d === void 0 ? void 0 : _d.getTransaction();
                expect(transaction).toBeDefined();
                if (transaction) {
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_WARM]).toBeUndefined();
                    expect(
                    // @ts-expect-error access private for test
                    transaction._measurements[APP_START_COLD]).toBeUndefined();
                }
            }));
            it('Does not add app start span if more than 60s', () => __awaiter(void 0, void 0, void 0, function* () {
                var _e;
                const integration = new ReactNativeTracing();
                const timeOriginMilliseconds = Date.now();
                const appStartTimeMilliseconds = timeOriginMilliseconds - 65000;
                const mockAppStartResponse = {
                    isColdStart: false,
                    appStartTime: appStartTimeMilliseconds,
                    didFetchAppStart: false,
                };
                mockFunction(getTimeOriginMilliseconds).mockReturnValue(timeOriginMilliseconds);
                mockFunction(NATIVE.fetchNativeAppStart).mockResolvedValue(mockAppStartResponse);
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_e = mockHub.getScope()) === null || _e === void 0 ? void 0 : _e.getTransaction();
                expect(transaction).toBeDefined();
                if (transaction) {
                    expect(
                    // @ts-expect-error access private for test
                    transaction.spanRecorder).toBeDefined();
                    expect(
                    // @ts-expect-error access private for test
                    transaction.spanRecorder.spans.some(span => span.op == APP_SPAN_START_WARM)).toBe(false);
                    expect(transaction.startTimestamp).toBeGreaterThanOrEqual(timeOriginMilliseconds / 1000);
                }
            }));
            it('Does not create app start transaction if didFetchAppStart == true', () => __awaiter(void 0, void 0, void 0, function* () {
                var _f;
                const integration = new ReactNativeTracing();
                mockAppStartResponse({ cold: false, didFetchAppStart: true });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                yield jest.advanceTimersByTimeAsync(500);
                const transaction = (_f = mockHub.getScope()) === null || _f === void 0 ? void 0 : _f.getTransaction();
                expect(transaction).toBeUndefined();
            }));
        });
        describe('With routing instrumentation', () => {
            it('Cancels route transaction when app goes to background', () => __awaiter(void 0, void 0, void 0, function* () {
                const routingInstrumentation = new RoutingInstrumentation();
                const integration = new ReactNativeTracing({
                    routingInstrumentation,
                });
                mockAppStartResponse({ cold: true });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                // wait for internal promises to resolve, fetch app start data from mocked native
                yield Promise.resolve();
                const routeTransaction = routingInstrumentation.onRouteWillChange({
                    name: 'test',
                });
                mockedAppState.setState('background');
                jest.runAllTimers();
                expect(routeTransaction.status).toBe('cancelled');
                expect(mockedAppState.removeSubscription).toBeCalledTimes(1);
            }));
            it('Adds measurements and child span onto existing routing transaction and sets the op (cold)', () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c;
                const routingInstrumentation = new RoutingInstrumentation();
                const integration = new ReactNativeTracing({
                    routingInstrumentation,
                });
                const [timeOriginMilliseconds, appStartTimeMilliseconds] = mockAppStartResponse({ cold: true });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                // wait for internal promises to resolve, fetch app start data from mocked native
                yield Promise.resolve();
                const transaction = (_a = mockHub.getScope()) === null || _a === void 0 ? void 0 : _a.getTransaction();
                expect(transaction).toBeUndefined();
                const routeTransaction = routingInstrumentation.onRouteWillChange({
                    name: 'test',
                });
                routeTransaction.initSpanRecorder(10);
                expect(routeTransaction).toBeDefined();
                expect(routeTransaction.spanId).toEqual((_c = (_b = mockHub.getScope()) === null || _b === void 0 ? void 0 : _b.getTransaction()) === null || _c === void 0 ? void 0 : _c.spanId);
                // trigger idle transaction to finish and call before finish callbacks
                jest.advanceTimersByTime(DEFAULT_IDLE_TIMEOUT);
                // @ts-expect-error access private for test
                expect(routeTransaction._measurements[APP_START_COLD].value).toBe(timeOriginMilliseconds - appStartTimeMilliseconds);
                expect(routeTransaction.op).toBe(UI_LOAD);
                expect(routeTransaction.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                const spanRecorder = routeTransaction.spanRecorder;
                expect(spanRecorder).toBeDefined();
                expect(spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans.length).toBeGreaterThan(1);
                const span = spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans[(spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans.length) - 1];
                expect(span === null || span === void 0 ? void 0 : span.op).toBe(APP_START_COLD_OP);
                expect(span === null || span === void 0 ? void 0 : span.description).toBe('Cold App Start');
                expect(span === null || span === void 0 ? void 0 : span.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                expect(span === null || span === void 0 ? void 0 : span.endTimestamp).toBe(timeOriginMilliseconds / 1000);
            }));
            it('Adds measurements and child span onto existing routing transaction and sets the op (warm)', () => __awaiter(void 0, void 0, void 0, function* () {
                var _d, _e;
                const routingInstrumentation = new RoutingInstrumentation();
                const integration = new ReactNativeTracing({
                    routingInstrumentation,
                });
                const [timeOriginMilliseconds, appStartTimeMilliseconds] = mockAppStartResponse({ cold: false });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                // wait for internal promises to resolve, fetch app start data from mocked native
                yield Promise.resolve();
                const transaction = (_d = mockHub.getScope()) === null || _d === void 0 ? void 0 : _d.getTransaction();
                expect(transaction).toBeUndefined();
                const routeTransaction = routingInstrumentation.onRouteWillChange({
                    name: 'test',
                });
                routeTransaction.initSpanRecorder(10);
                expect(routeTransaction).toBeDefined();
                expect(routeTransaction).toBe((_e = mockHub.getScope()) === null || _e === void 0 ? void 0 : _e.getTransaction());
                // trigger idle transaction to finish and call before finish callbacks
                jest.advanceTimersByTime(DEFAULT_IDLE_TIMEOUT);
                // @ts-expect-error access private for test
                expect(routeTransaction._measurements[APP_START_WARM].value).toBe(timeOriginMilliseconds - appStartTimeMilliseconds);
                expect(routeTransaction.op).toBe(UI_LOAD);
                expect(routeTransaction.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                const spanRecorder = routeTransaction.spanRecorder;
                expect(spanRecorder).toBeDefined();
                expect(spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans.length).toBeGreaterThan(1);
                const span = spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans[(spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans.length) - 1];
                expect(span === null || span === void 0 ? void 0 : span.op).toBe(APP_START_WARM_OP);
                expect(span === null || span === void 0 ? void 0 : span.description).toBe('Warm App Start');
                expect(span === null || span === void 0 ? void 0 : span.startTimestamp).toBe(appStartTimeMilliseconds / 1000);
                expect(span === null || span === void 0 ? void 0 : span.endTimestamp).toBe(timeOriginMilliseconds / 1000);
            }));
            it('Does not update route transaction if didFetchAppStart == true', () => __awaiter(void 0, void 0, void 0, function* () {
                var _f, _g;
                const routingInstrumentation = new RoutingInstrumentation();
                const integration = new ReactNativeTracing({
                    routingInstrumentation,
                });
                const [, appStartTimeMilliseconds] = mockAppStartResponse({ cold: false, didFetchAppStart: true });
                const mockHub = getMockHub();
                integration.setupOnce(addGlobalEventProcessor, () => mockHub);
                // wait for internal promises to resolve, fetch app start data from mocked native
                yield Promise.resolve();
                const transaction = (_f = mockHub.getScope()) === null || _f === void 0 ? void 0 : _f.getTransaction();
                expect(transaction).toBeUndefined();
                const routeTransaction = routingInstrumentation.onRouteWillChange({
                    name: 'test',
                });
                routeTransaction.initSpanRecorder(10);
                expect(routeTransaction).toBeDefined();
                expect(routeTransaction).toBe((_g = mockHub.getScope()) === null || _g === void 0 ? void 0 : _g.getTransaction());
                // trigger idle transaction to finish and call before finish callbacks
                jest.advanceTimersByTime(DEFAULT_IDLE_TIMEOUT);
                // @ts-expect-error access private for test
                expect(routeTransaction._measurements).toMatchObject({});
                expect(routeTransaction.op).not.toBe(UI_LOAD);
                expect(routeTransaction.startTimestamp).not.toBe(appStartTimeMilliseconds / 1000);
                const spanRecorder = routeTransaction.spanRecorder;
                expect(spanRecorder).toBeDefined();
                expect(spanRecorder === null || spanRecorder === void 0 ? void 0 : spanRecorder.spans.length).toBe(2);
            }));
        });
        it('Does not instrument app start if app start is disabled', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const integration = new ReactNativeTracing({
                enableAppStartTracking: false,
            });
            const mockHub = getMockHub();
            integration.setupOnce(addGlobalEventProcessor, () => mockHub);
            yield jest.advanceTimersByTimeAsync(500);
            expect(NATIVE.fetchNativeAppStart).not.toBeCalled();
            const transaction = (_a = mockHub.getScope()) === null || _a === void 0 ? void 0 : _a.getTransaction();
            expect(transaction).toBeUndefined();
        }));
        it('Does not instrument app start if native is disabled', () => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            NATIVE.enableNative = false;
            const integration = new ReactNativeTracing();
            const mockHub = getMockHub();
            integration.setupOnce(addGlobalEventProcessor, () => mockHub);
            yield jest.advanceTimersByTimeAsync(500);
            expect(NATIVE.fetchNativeAppStart).not.toBeCalled();
            const transaction = (_b = mockHub.getScope()) === null || _b === void 0 ? void 0 : _b.getTransaction();
            expect(transaction).toBeUndefined();
        }));
        it('Does not instrument app start if fetchNativeAppStart returns null', () => __awaiter(void 0, void 0, void 0, function* () {
            var _c;
            mockFunction(NATIVE.fetchNativeAppStart).mockResolvedValue(null);
            const integration = new ReactNativeTracing();
            const mockHub = getMockHub();
            integration.setupOnce(addGlobalEventProcessor, () => mockHub);
            yield jest.advanceTimersByTimeAsync(500);
            expect(NATIVE.fetchNativeAppStart).toBeCalledTimes(1);
            const transaction = (_c = mockHub.getScope()) === null || _c === void 0 ? void 0 : _c.getTransaction();
            expect(transaction).toBeUndefined();
        }));
    });
    describe('Native Frames', () => {
        it('Initialize native frames instrumentation if flag is true', () => __awaiter(void 0, void 0, void 0, function* () {
            const integration = new ReactNativeTracing({
                enableNativeFramesTracking: true,
            });
            const mockHub = getMockHub();
            integration.setupOnce(addGlobalEventProcessor, () => mockHub);
            yield jest.advanceTimersByTimeAsync(500);
            expect(integration.nativeFramesInstrumentation).toBeDefined();
            expect(NATIVE.enableNativeFramesTracking).toBeCalledTimes(1);
        }));
        it('Does not initialize native frames instrumentation if flag is false', () => __awaiter(void 0, void 0, void 0, function* () {
            const integration = new ReactNativeTracing({
                enableNativeFramesTracking: false,
            });
            const mockHub = getMockHub();
            integration.setupOnce(addGlobalEventProcessor, () => mockHub);
            yield jest.advanceTimersByTimeAsync(500);
            expect(integration.nativeFramesInstrumentation).toBeUndefined();
            expect(NATIVE.disableNativeFramesTracking).toBeCalledTimes(1);
            expect(NATIVE.fetchNativeFrames).not.toBeCalled();
        }));
    });
    describe('Routing Instrumentation', () => {
        describe('_onConfirmRoute', () => {
            it('Sets app context, tag and adds breadcrumb', () => {
                var _a, _b;
                const routing = new RoutingInstrumentation();
                const integration = new ReactNativeTracing({
                    routingInstrumentation: routing,
                });
                let mockEvent = { contexts: {} };
                const mockScope = {
                    addBreadcrumb: jest.fn(),
                    setTag: jest.fn(),
                    setContext: jest.fn(),
                    // Not relevant to test
                    setSpan: () => { },
                    getTransaction: () => { },
                    clearTransaction: () => { },
                };
                const mockHub = {
                    configureScope: (callback) => {
                        callback(mockScope);
                    },
                    // Not relevant to test
                    getScope: () => mockScope,
                    getClient: () => ({
                        getOptions: () => ({}),
                        recordDroppedEvent: () => { },
                    }),
                };
                integration.setupOnce(() => { }, () => mockHub);
                const routeContext = {
                    name: 'Route',
                    data: {
                        route: {
                            name: 'Route',
                        },
                        previousRoute: {
                            name: 'Previous Route',
                        },
                    },
                };
                routing.onRouteWillChange(routeContext);
                mockEvent = integration['_getCurrentViewEventProcessor'](mockEvent);
                if (!mockEvent) {
                    throw new Error('mockEvent was not defined');
                }
                expect((_a = mockEvent.contexts) === null || _a === void 0 ? void 0 : _a.app).toBeDefined();
                // Only required to mark app as defined.
                if ((_b = mockEvent.contexts) === null || _b === void 0 ? void 0 : _b.app) {
                    expect(mockEvent.contexts.app['view_names']).toEqual([routeContext.name]);
                }
                /**
                 * @deprecated tag routing.route.name will be removed in the future.
                 */
                expect(mockScope.setTag).toBeCalledWith('routing.route.name', routeContext.name);
                expect(mockScope.addBreadcrumb).toBeCalledWith({
                    type: 'navigation',
                    category: 'navigation',
                    message: `Navigation to ${routeContext.name}`,
                    data: {
                        from: routeContext.data.previousRoute.name,
                        to: routeContext.data.route.name,
                    },
                });
            });
            describe('View Names event processor', () => {
                it('Do not overwrite event app context', () => {
                    const routing = new RoutingInstrumentation();
                    const integration = new ReactNativeTracing({
                        routingInstrumentation: routing,
                    });
                    const expectedRouteName = 'Route';
                    const event = { contexts: { app: { appKey: 'value' } } };
                    const expectedEvent = { contexts: { app: { appKey: 'value', view_names: [expectedRouteName] } } };
                    // @ts-expect-error only for testing.
                    integration._currentViewName = expectedRouteName;
                    const processedEvent = integration['_getCurrentViewEventProcessor'](event);
                    expect(processedEvent).toEqual(expectedEvent);
                });
                it('Do not add view_names if context is undefined', () => {
                    const routing = new RoutingInstrumentation();
                    const integration = new ReactNativeTracing({
                        routingInstrumentation: routing,
                    });
                    const expectedRouteName = 'Route';
                    const event = { release: 'value' };
                    const expectedEvent = { release: 'value' };
                    // @ts-expect-error only for testing.
                    integration._currentViewName = expectedRouteName;
                    const processedEvent = integration['_getCurrentViewEventProcessor'](event);
                    expect(processedEvent).toEqual(expectedEvent);
                });
                it('ignore view_names if undefined', () => {
                    const routing = new RoutingInstrumentation();
                    const integration = new ReactNativeTracing({
                        routingInstrumentation: routing,
                    });
                    const event = { contexts: { app: { key: 'value ' } } };
                    const expectedEvent = { contexts: { app: { key: 'value ' } } };
                    const processedEvent = integration['_getCurrentViewEventProcessor'](event);
                    expect(processedEvent).toEqual(expectedEvent);
                });
            });
        });
    });
    describe('Handling deprecated options', () => {
        test('finalTimeoutMs overrides maxTransactionDuration', () => {
            const tracing = new ReactNativeTracing({
                finalTimeoutMs: 123000,
                maxTransactionDuration: 456,
            });
            expect(tracing.options.finalTimeoutMs).toBe(123000);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.maxTransactionDuration).toBe(456);
        });
        test('maxTransactionDuration translates to finalTimeoutMs', () => {
            const tracing = new ReactNativeTracing({
                maxTransactionDuration: 123,
            });
            expect(tracing.options.finalTimeoutMs).toBe(123000);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.maxTransactionDuration).toBe(123);
        });
        test('if none maxTransactionDuration and finalTimeoutMs is specified use default', () => {
            const tracing = new ReactNativeTracing({});
            expect(tracing.options.finalTimeoutMs).toBe(600000);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.maxTransactionDuration).toBe(600);
        });
        test('idleTimeoutMs overrides idleTimeout', () => {
            const tracing = new ReactNativeTracing({
                idleTimeoutMs: 123,
                idleTimeout: 456,
            });
            expect(tracing.options.idleTimeoutMs).toBe(123);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.idleTimeout).toBe(456);
        });
        test('idleTimeout translates to idleTimeoutMs', () => {
            const tracing = new ReactNativeTracing({
                idleTimeout: 123,
            });
            expect(tracing.options.idleTimeoutMs).toBe(123);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.idleTimeout).toBe(123);
        });
        test('if none idleTimeout and idleTimeoutMs is specified use default', () => {
            const tracing = new ReactNativeTracing({});
            expect(tracing.options.idleTimeoutMs).toBe(1000);
            // eslint-disable-next-line deprecation/deprecation
            expect(tracing.options.idleTimeout).toBe(1000);
        });
    });
    describe('User Interaction Tracing', () => {
        let mockedScope;
        let mockedHub;
        let tracing;
        let mockedUserInteractionId;
        let mockedRoutingInstrumentation;
        beforeEach(() => {
            mockedUserInteractionId = { elementId: 'mockedElementId', op: 'mocked.op' };
            mockedHub = getMockHub();
            mockedScope = mockedHub.getScope();
            mockedRoutingInstrumentation = createMockedRoutingInstrumentation();
        });
        describe('disabled user interaction', () => {
            test('User interaction tracing is disabled by default', () => {
                tracing = new ReactNativeTracing();
                tracing.setupOnce(jest.fn(), () => mockedHub);
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                expect(tracing.options.enableUserInteractionTracing).toBeFalsy();
                expect(mockedScope.setSpan).not.toBeCalled();
            });
        });
        describe('enabled user interaction', () => {
            beforeEach(() => {
                tracing = new ReactNativeTracing({
                    routingInstrumentation: mockedRoutingInstrumentation,
                    enableUserInteractionTracing: true,
                });
                tracing.setupOnce(jest.fn(), () => mockedHub);
                mockedRoutingInstrumentation.registeredOnConfirmRoute(mockedConfirmedRouteTransactionContext);
            });
            test('user interaction tracing is enabled and transaction is bound to scope', () => {
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const actualTransaction = mockFunction(mockedScope.setSpan).mock.calls[0][firstArg];
                const actualTransactionContext = actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.toContext();
                expect(tracing.options.enableUserInteractionTracing).toBeTruthy();
                expect(actualTransactionContext).toEqual(expect.objectContaining({
                    name: 'mockedRouteName.mockedElementId',
                    op: 'mocked.op',
                }));
            });
            test('UI event transaction not sampled if no child spans', () => {
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                jest.runAllTimers();
                const actualTransaction = mockFunction(mockedScope.setSpan).mock.calls[0][firstArg];
                const actualTransactionContext = actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.toContext();
                expect(actualTransactionContext === null || actualTransactionContext === void 0 ? void 0 : actualTransactionContext.sampled).toEqual(false);
            });
            test('does cancel UI event transaction when app goes to background', () => {
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const actualTransaction = mockedScope.getTransaction();
                mockedAppState.setState('background');
                jest.runAllTimers();
                const actualTransactionContext = actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.toContext();
                expect(actualTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    status: 'cancelled',
                }));
                expect(mockedAppState.removeSubscription).toBeCalledTimes(1);
            });
            test('do not overwrite existing status of UI event transactions', () => {
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const actualTransaction = mockedScope.getTransaction();
                actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.setStatus('mocked_status');
                jest.runAllTimers();
                const actualTransactionContext = actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.toContext();
                expect(actualTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    status: 'mocked_status',
                }));
            });
            test('same UI event and same element does not reschedule idle timeout', () => {
                const timeoutCloseToActualIdleTimeoutMs = 800;
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const actualTransaction = mockedScope.getTransaction();
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                expect(actualTransaction === null || actualTransaction === void 0 ? void 0 : actualTransaction.toContext().endTimestamp).toEqual(expect.any(Number));
            });
            test('different UI event and same element finish first and start new transaction', () => {
                const timeoutCloseToActualIdleTimeoutMs = 800;
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const firstTransaction = mockedScope.getTransaction();
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                const childFirstTransaction = firstTransaction === null || firstTransaction === void 0 ? void 0 : firstTransaction.startChild({ op: 'child.op' });
                tracing.startUserInteractionTransaction(Object.assign(Object.assign({}, mockedUserInteractionId), { op: 'different.op' }));
                const secondTransaction = mockedScope.getTransaction();
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                childFirstTransaction === null || childFirstTransaction === void 0 ? void 0 : childFirstTransaction.finish();
                jest.runAllTimers();
                const firstTransactionContext = firstTransaction === null || firstTransaction === void 0 ? void 0 : firstTransaction.toContext();
                const secondTransactionContext = secondTransaction === null || secondTransaction === void 0 ? void 0 : secondTransaction.toContext();
                expect(firstTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    op: 'mocked.op',
                    sampled: true,
                }));
                expect(secondTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    op: 'different.op',
                }));
                expect(firstTransactionContext.endTimestamp).toBeGreaterThanOrEqual(secondTransactionContext.startTimestamp);
            });
            test('different UI event and same element finish first transaction with last span', () => {
                const timeoutCloseToActualIdleTimeoutMs = 800;
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const firstTransaction = mockedScope.getTransaction();
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                const childFirstTransaction = firstTransaction === null || firstTransaction === void 0 ? void 0 : firstTransaction.startChild({ op: 'child.op' });
                tracing.startUserInteractionTransaction(Object.assign(Object.assign({}, mockedUserInteractionId), { op: 'different.op' }));
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                childFirstTransaction === null || childFirstTransaction === void 0 ? void 0 : childFirstTransaction.finish();
                const firstTransactionContext = firstTransaction === null || firstTransaction === void 0 ? void 0 : firstTransaction.toContext();
                expect(firstTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    op: 'mocked.op',
                    sampled: true,
                }));
            });
            test('same ui event after UI event transaction finished', () => {
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const firstTransaction = mockedScope.getTransaction();
                jest.runAllTimers();
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const secondTransaction = mockedScope.getTransaction();
                jest.runAllTimers();
                const firstTransactionContext = firstTransaction === null || firstTransaction === void 0 ? void 0 : firstTransaction.toContext();
                const secondTransactionContext = secondTransaction === null || secondTransaction === void 0 ? void 0 : secondTransaction.toContext();
                expect(firstTransactionContext.endTimestamp).toEqual(expect.any(Number));
                expect(secondTransactionContext.endTimestamp).toEqual(expect.any(Number));
                expect(firstTransactionContext.spanId).not.toEqual(secondTransactionContext.spanId);
            });
            test('do not start UI event transaction if active transaction on scope', () => {
                const activeTransaction = new Transaction({ name: 'activeTransactionOnScope' }, mockedHub);
                mockedScope.setSpan(activeTransaction);
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                expect(mockedScope.setSpan).toBeCalledTimes(1);
                expect(mockedScope.setSpan).toBeCalledWith(activeTransaction);
            });
            test('UI event transaction is canceled when routing transaction starts', () => {
                const timeoutCloseToActualIdleTimeoutMs = 800;
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const interactionTransaction = mockedScope.getTransaction();
                jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
                const routingTransaction = mockedRoutingInstrumentation.registeredListener({
                    name: 'newMockedRouteName',
                });
                jest.runAllTimers();
                const interactionTransactionContext = interactionTransaction === null || interactionTransaction === void 0 ? void 0 : interactionTransaction.toContext();
                const routingTransactionContext = routingTransaction === null || routingTransaction === void 0 ? void 0 : routingTransaction.toContext();
                expect(interactionTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                    status: 'cancelled',
                }));
                expect(routingTransactionContext).toEqual(expect.objectContaining({
                    endTimestamp: expect.any(Number),
                }));
                expect(interactionTransactionContext.endTimestamp).toBeLessThanOrEqual(routingTransactionContext.startTimestamp);
            });
            test('UI event transaction calls lifecycle callbacks', () => {
                tracing.onTransactionStart = jest.fn(tracing.onTransactionStart.bind(tracing));
                tracing.onTransactionFinish = jest.fn(tracing.onTransactionFinish.bind(tracing));
                tracing.startUserInteractionTransaction(mockedUserInteractionId);
                const actualTransaction = mockedScope.getTransaction();
                jest.runAllTimers();
                expect(tracing.onTransactionStart).toBeCalledTimes(1);
                expect(tracing.onTransactionFinish).toBeCalledTimes(1);
                expect(tracing.onTransactionStart).toBeCalledWith(actualTransaction);
                expect(tracing.onTransactionFinish).toBeCalledWith(actualTransaction);
            });
        });
    });
});
function mockAppStartResponse({ cold, didFetchAppStart }) {
    const timeOriginMilliseconds = Date.now();
    const appStartTimeMilliseconds = timeOriginMilliseconds - 100;
    const mockAppStartResponse = {
        isColdStart: cold,
        appStartTime: appStartTimeMilliseconds,
        didFetchAppStart: didFetchAppStart !== null && didFetchAppStart !== void 0 ? didFetchAppStart : false,
    };
    mockFunction(getTimeOriginMilliseconds).mockReturnValue(timeOriginMilliseconds);
    mockFunction(NATIVE.fetchNativeAppStart).mockResolvedValue(mockAppStartResponse);
    return [timeOriginMilliseconds, appStartTimeMilliseconds];
}
