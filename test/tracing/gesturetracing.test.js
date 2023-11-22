import { BrowserClient } from '@sentry/browser';
import { Hub } from '@sentry/core';
import { UI_ACTION } from '../../src/js/tracing';
import { DEFAULT_BREADCRUMB_CATEGORY as DEFAULT_GESTURE_BREADCRUMB_CATEGORY, DEFAULT_BREADCRUMB_TYPE as DEFAULT_GESTURE_BREADCRUMB_TYPE, sentryTraceGesture, } from '../../src/js/tracing/gesturetracing';
import { ReactNativeTracing } from '../../src/js/tracing/reactnativetracing';
import { createMockedRoutingInstrumentation, mockedConfirmedRouteTransactionContext, } from './mockedrountinginstrumention';
jest.mock('../../src/js/wrapper', () => {
    return {
        NATIVE: {
            fetchNativeAppStart: jest.fn(),
            fetchNativeFrames: jest.fn(() => Promise.resolve()),
            enableNativeFramesTracking: jest.fn(() => Promise.resolve()),
            enableNative: true,
        },
    };
});
const getMockScope = () => {
    let scopeTransaction;
    let scopeUser;
    return {
        getTransaction: () => scopeTransaction,
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
const mockAddBreadcrumb = jest.fn();
const getMockHub = () => {
    const mockHub = new Hub(new BrowserClient({ tracesSampleRate: 1 }));
    const mockScope = getMockScope();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHub.getScope = () => mockScope;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHub.configureScope = jest.fn(callback => callback(mockScope));
    mockHub.addBreadcrumb = mockAddBreadcrumb;
    return mockHub;
};
describe('GestureTracing', () => {
    const label = 'testGesture';
    describe('gracefully fails on invalid gestures', () => {
        it('gesture is undefined', () => {
            const gesture = undefined;
            expect(sentryTraceGesture(label, gesture)).toBeUndefined();
        });
        it('gesture has no handlers', () => {
            const gesture = {};
            expect(sentryTraceGesture(label, gesture)).toEqual({});
        });
    });
    describe('traces gestures', () => {
        let mockedScope;
        let mockedHub;
        let tracing;
        let mockedRoutingInstrumentation;
        let mockedGesture;
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
            mockedHub = getMockHub();
            mockedScope = mockedHub.getScope();
            mockedRoutingInstrumentation = createMockedRoutingInstrumentation();
            tracing = new ReactNativeTracing({
                routingInstrumentation: mockedRoutingInstrumentation,
                enableUserInteractionTracing: true,
            });
            tracing.setupOnce(jest.fn(), jest.fn().mockReturnValue(mockedHub));
            // client.addIntegration uses global getCurrentHub, so we don't use it to keep the mockedHub
            mockedHub.getClient()._integrations[ReactNativeTracing.name] =
                tracing;
            mockedRoutingInstrumentation.registeredOnConfirmRoute(mockedConfirmedRouteTransactionContext);
            mockedGesture = {
                handlers: {
                    onBegin: jest.fn(),
                    onEnd: jest.fn(),
                },
                handlerName: 'MockGestureHandler',
            };
        });
        afterEach(() => {
            jest.runAllTimers();
            jest.useRealTimers();
        });
        it('gesture creates interaction transaction', () => {
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            const transaction = mockedScope.getTransaction();
            jest.runAllTimers();
            const transactionContext = transaction === null || transaction === void 0 ? void 0 : transaction.toContext();
            expect(transactionContext).toEqual(expect.objectContaining({
                endTimestamp: expect.any(Number),
                op: `${UI_ACTION}.mock`,
            }));
        });
        it('gesture interaction transaction falls back on invalid handler name', () => {
            mockedGesture.handlerName = 'Invalid';
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            const transaction = mockedScope.getTransaction();
            jest.runAllTimers();
            const transactionContext = transaction === null || transaction === void 0 ? void 0 : transaction.toContext();
            expect(transactionContext).toEqual(expect.objectContaining({
                endTimestamp: expect.any(Number),
                op: `${UI_ACTION}.gesture`,
            }));
        });
        it('gesture cancel previous interaction transaction', () => {
            var _a, _b;
            const timeoutCloseToActualIdleTimeoutMs = 800;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            const mockedTouchInteractionId = { elementId: 'mockedElementId', op: 'mocked.op' };
            tracing.startUserInteractionTransaction(mockedTouchInteractionId);
            const touchTransaction = mockedScope.getTransaction();
            touchTransaction === null || touchTransaction === void 0 ? void 0 : touchTransaction.startChild({ op: 'child.op' }).finish();
            jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
            (_b = (_a = mockedGesture.handlers) === null || _a === void 0 ? void 0 : _a.onBegin) === null || _b === void 0 ? void 0 : _b.call(_a);
            const gestureTransaction = mockedScope.getTransaction();
            jest.advanceTimersByTime(timeoutCloseToActualIdleTimeoutMs);
            jest.runAllTimers();
            const touchTransactionContext = touchTransaction === null || touchTransaction === void 0 ? void 0 : touchTransaction.toContext();
            const gestureTransactionContext = gestureTransaction === null || gestureTransaction === void 0 ? void 0 : gestureTransaction.toContext();
            expect(touchTransactionContext).toEqual(expect.objectContaining({
                endTimestamp: expect.any(Number),
                op: 'mocked.op',
                sampled: true,
            }));
            expect(gestureTransactionContext).toEqual(expect.objectContaining({
                endTimestamp: expect.any(Number),
            }));
        });
        it('gesture original on begin handler is called', () => {
            var _a;
            const original = (_a = mockedGesture.handlers) === null || _a === void 0 ? void 0 : _a.onBegin;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            jest.runAllTimers();
            expect(original).toHaveBeenCalledTimes(1);
        });
        it('creates gesture on begin handled if non exists', () => {
            var _a, _b;
            (_a = mockedGesture.handlers) === null || _a === void 0 ? true : delete _a.onBegin;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            jest.runAllTimers();
            expect((_b = mockedGesture.handlers) === null || _b === void 0 ? void 0 : _b.onBegin).toBeDefined();
        });
        it('gesture original on end handler is called', () => {
            var _a;
            const original = (_a = mockedGesture.handlers) === null || _a === void 0 ? void 0 : _a.onEnd;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onEnd();
            jest.runAllTimers();
            expect(original).toHaveBeenCalledTimes(1);
        });
        it('creates gesture on end handled if non exists', () => {
            var _a, _b;
            (_a = mockedGesture.handlers) === null || _a === void 0 ? true : delete _a.onEnd;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onEnd();
            jest.runAllTimers();
            expect((_b = mockedGesture.handlers) === null || _b === void 0 ? void 0 : _b.onBegin).toBeDefined();
        });
        it('creates gesture on begin handled if non exists', () => {
            var _a, _b;
            (_a = mockedGesture.handlers) === null || _a === void 0 ? true : delete _a.onBegin;
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            jest.runAllTimers();
            expect((_b = mockedGesture.handlers) === null || _b === void 0 ? void 0 : _b.onBegin).toBeDefined();
        });
        it('wrapped gesture creates breadcrumb on begin', () => {
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin();
            jest.runAllTimers();
            expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
            expect(mockAddBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
                category: DEFAULT_GESTURE_BREADCRUMB_CATEGORY,
                type: DEFAULT_GESTURE_BREADCRUMB_TYPE,
                level: 'info',
            }));
        });
        it('wrapped gesture creates breadcrumb on end', () => {
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onEnd();
            jest.runAllTimers();
            expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
            expect(mockAddBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
                category: DEFAULT_GESTURE_BREADCRUMB_CATEGORY,
                type: DEFAULT_GESTURE_BREADCRUMB_TYPE,
                level: 'info',
            }));
        });
        it('wrapped gesture creates breadcrumb only with selected event keys', () => {
            sentryTraceGesture('mockedGesture', mockedGesture, { getCurrentHub: () => mockedHub });
            mockedGesture.handlers.onBegin({ notSelectedKey: 'notSelectedValue', scale: 1 });
            jest.runAllTimers();
            expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
            expect(mockAddBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    scale: 1,
                    gesture: 'mock',
                },
            }));
        });
    });
});
