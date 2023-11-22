var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from '@sentry/core';
import { BLANK_TRANSACTION_CONTEXT, ReactNavigationInstrumentation } from '../../src/js/tracing/reactnavigation';
import { RN_GLOBAL_OBJ } from '../../src/js/utils/worldwide';
const dummyRoute = {
    name: 'Route',
    key: '0',
};
class MockNavigationContainer {
    constructor() {
        this.currentRoute = dummyRoute;
        this.listeners = {};
        this.addListener = jest.fn((eventType, listener) => {
            this.listeners[eventType] = listener;
        });
    }
    getCurrentRoute() {
        return this.currentRoute;
    }
}
const getMockTransaction = () => {
    const transaction = new Transaction(BLANK_TRANSACTION_CONTEXT);
    // Assume it's sampled
    transaction.sampled = true;
    return transaction;
};
describe('ReactNavigationInstrumentation', () => {
    afterEach(() => {
        RN_GLOBAL_OBJ.__sentry_rn_v5_registered = false;
        jest.resetAllMocks();
    });
    test('transaction set on initialize', () => {
        const instrumentation = new ReactNavigationInstrumentation();
        const mockTransaction = getMockTransaction();
        const tracingListener = jest.fn(() => mockTransaction);
        instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
        const mockNavigationContainerRef = {
            current: new MockNavigationContainer(),
        };
        instrumentation.registerNavigationContainer(mockNavigationContainerRef);
        expect(mockTransaction.name).toBe(dummyRoute.name);
        expect(mockTransaction.tags).toStrictEqual(Object.assign(Object.assign({}, BLANK_TRANSACTION_CONTEXT.tags), { 'routing.route.name': dummyRoute.name }));
        expect(mockTransaction.data).toStrictEqual({
            route: {
                name: dummyRoute.name,
                key: dummyRoute.key,
                params: {},
                hasBeenSeen: false,
            },
            previousRoute: null,
        });
        expect(mockTransaction.metadata.source).toBe('component');
    });
    test('transaction sent on navigation', () => __awaiter(void 0, void 0, void 0, function* () {
        const instrumentation = new ReactNavigationInstrumentation();
        // Need a dummy transaction as the instrumentation will start a transaction right away when the first navigation container is attached.
        const mockTransactionDummy = getMockTransaction();
        const transactionRef = {
            current: mockTransactionDummy,
        };
        const tracingListener = jest.fn(() => transactionRef.current);
        instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
        const mockNavigationContainerRef = {
            current: new MockNavigationContainer(),
        };
        instrumentation.registerNavigationContainer(mockNavigationContainerRef);
        const mockTransaction = getMockTransaction();
        transactionRef.current = mockTransaction;
        mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
        yield new Promise(resolve => {
            setTimeout(() => {
                const route = {
                    name: 'New Route',
                    key: '1',
                    params: {
                        someParam: 42,
                    },
                };
                // If .getCurrentRoute() is undefined, ignore state change
                mockNavigationContainerRef.current.currentRoute = undefined;
                mockNavigationContainerRef.current.listeners['state']({});
                mockNavigationContainerRef.current.currentRoute = route;
                mockNavigationContainerRef.current.listeners['state']({});
                expect(mockTransaction.name).toBe(route.name);
                expect(mockTransaction.tags).toStrictEqual(Object.assign(Object.assign({}, BLANK_TRANSACTION_CONTEXT.tags), { 'routing.route.name': route.name }));
                expect(mockTransaction.data).toStrictEqual({
                    route: {
                        name: route.name,
                        key: route.key,
                        params: route.params,
                        hasBeenSeen: false,
                    },
                    previousRoute: {
                        name: dummyRoute.name,
                        key: dummyRoute.key,
                        params: {},
                    },
                });
                expect(mockTransaction.metadata.source).toBe('component');
                resolve();
            }, 50);
        });
    }));
    test('transaction context changed with beforeNavigate', () => __awaiter(void 0, void 0, void 0, function* () {
        const instrumentation = new ReactNavigationInstrumentation();
        // Need a dummy transaction as the instrumentation will start a transaction right away when the first navigation container is attached.
        const mockTransactionDummy = getMockTransaction();
        const transactionRef = {
            current: mockTransactionDummy,
        };
        const tracingListener = jest.fn(() => transactionRef.current);
        instrumentation.registerRoutingInstrumentation(tracingListener, context => {
            context.sampled = false;
            context.description = 'Description';
            context.name = 'New Name';
            return context;
        }, () => { });
        const mockNavigationContainerRef = {
            current: new MockNavigationContainer(),
        };
        instrumentation.registerNavigationContainer(mockNavigationContainerRef);
        const mockTransaction = getMockTransaction();
        transactionRef.current = mockTransaction;
        mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
        yield new Promise(resolve => {
            setTimeout(() => {
                const route = {
                    name: 'DoNotSend',
                    key: '1',
                };
                mockNavigationContainerRef.current.currentRoute = route;
                mockNavigationContainerRef.current.listeners['state']({});
                expect(mockTransaction.sampled).toBe(false);
                expect(mockTransaction.name).toBe('New Name');
                expect(mockTransaction.description).toBe('Description');
                expect(mockTransaction.metadata.source).toBe('custom');
                resolve();
            }, 50);
        });
    }));
    test('transaction not sent on a cancelled navigation', () => __awaiter(void 0, void 0, void 0, function* () {
        const instrumentation = new ReactNavigationInstrumentation();
        // Need a dummy transaction as the instrumentation will start a transaction right away when the first navigation container is attached.
        const mockTransactionDummy = getMockTransaction();
        const transactionRef = {
            current: mockTransactionDummy,
        };
        const tracingListener = jest.fn(() => transactionRef.current);
        instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
        const mockNavigationContainerRef = {
            current: new MockNavigationContainer(),
        };
        instrumentation.registerNavigationContainer(mockNavigationContainerRef);
        const mockTransaction = getMockTransaction();
        transactionRef.current = mockTransaction;
        mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
        yield new Promise(resolve => {
            setTimeout(() => {
                expect(mockTransaction.sampled).toBe(false);
                expect(mockTransaction.name).toStrictEqual(BLANK_TRANSACTION_CONTEXT.name);
                expect(mockTransaction.tags).toStrictEqual(BLANK_TRANSACTION_CONTEXT.tags);
                expect(mockTransaction.data).toStrictEqual({});
                resolve();
            }, 1100);
        });
    }));
    test('transaction not sent on multiple cancelled navigations', () => __awaiter(void 0, void 0, void 0, function* () {
        const instrumentation = new ReactNavigationInstrumentation();
        // Need a dummy transaction as the instrumentation will start a transaction right away when the first navigation container is attached.
        const mockTransactionDummy = getMockTransaction();
        const transactionRef = {
            current: mockTransactionDummy,
        };
        const tracingListener = jest.fn(() => transactionRef.current);
        instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
        const mockNavigationContainerRef = {
            current: new MockNavigationContainer(),
        };
        instrumentation.registerNavigationContainer(mockNavigationContainerRef);
        const mockTransaction1 = getMockTransaction();
        transactionRef.current = mockTransaction1;
        mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
        const mockTransaction2 = getMockTransaction();
        transactionRef.current = mockTransaction2;
        mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
        yield new Promise(resolve => {
            setTimeout(() => {
                expect(mockTransaction1.sampled).toBe(false);
                expect(mockTransaction2.sampled).toBe(false);
                resolve();
            }, 1100);
        });
    }));
    describe('navigation container registration', () => {
        test('registers navigation container object ref', () => {
            const instrumentation = new ReactNavigationInstrumentation();
            const mockNavigationContainer = new MockNavigationContainer();
            instrumentation.registerNavigationContainer({
                current: mockNavigationContainer,
            });
            expect(RN_GLOBAL_OBJ.__sentry_rn_v5_registered).toBe(true);
            expect(mockNavigationContainer.addListener).toHaveBeenNthCalledWith(1, '__unsafe_action__', expect.any(Function));
            expect(mockNavigationContainer.addListener).toHaveBeenNthCalledWith(2, 'state', expect.any(Function));
        });
        test('registers navigation container direct ref', () => {
            const instrumentation = new ReactNavigationInstrumentation();
            const mockNavigationContainer = new MockNavigationContainer();
            instrumentation.registerNavigationContainer(mockNavigationContainer);
            expect(RN_GLOBAL_OBJ.__sentry_rn_v5_registered).toBe(true);
            expect(mockNavigationContainer.addListener).toHaveBeenNthCalledWith(1, '__unsafe_action__', expect.any(Function));
            expect(mockNavigationContainer.addListener).toHaveBeenNthCalledWith(2, 'state', expect.any(Function));
        });
        test('does not register navigation container if there is an existing one', () => {
            RN_GLOBAL_OBJ.__sentry_rn_v5_registered = true;
            const instrumentation = new ReactNavigationInstrumentation();
            const mockNavigationContainer = new MockNavigationContainer();
            instrumentation.registerNavigationContainer({
                current: mockNavigationContainer,
            });
            expect(RN_GLOBAL_OBJ.__sentry_rn_v5_registered).toBe(true);
            expect(mockNavigationContainer.addListener).not.toHaveBeenCalled();
            expect(mockNavigationContainer.addListener).not.toHaveBeenCalled();
        });
        test('works if routing instrumentation registration is after navigation registration', () => __awaiter(void 0, void 0, void 0, function* () {
            const instrumentation = new ReactNavigationInstrumentation();
            const mockNavigationContainer = new MockNavigationContainer();
            instrumentation.registerNavigationContainer(mockNavigationContainer);
            const mockTransaction = getMockTransaction();
            const tracingListener = jest.fn(() => mockTransaction);
            instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
            yield new Promise(resolve => {
                setTimeout(() => {
                    expect(mockTransaction.sampled).not.toBe(false);
                    resolve();
                }, 500);
            });
        }));
    });
    describe('options', () => {
        test('waits until routeChangeTimeoutMs', () => __awaiter(void 0, void 0, void 0, function* () {
            const instrumentation = new ReactNavigationInstrumentation({
                routeChangeTimeoutMs: 200,
            });
            const mockTransaction = getMockTransaction();
            const tracingListener = jest.fn(() => mockTransaction);
            instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
            const mockNavigationContainerRef = {
                current: new MockNavigationContainer(),
            };
            return new Promise(resolve => {
                setTimeout(() => {
                    instrumentation.registerNavigationContainer(mockNavigationContainerRef);
                    expect(mockTransaction.sampled).toBe(true);
                    expect(mockTransaction.name).toBe(dummyRoute.name);
                    resolve();
                }, 190);
            });
        }));
        test('discards if after routeChangeTimeoutMs', () => __awaiter(void 0, void 0, void 0, function* () {
            const instrumentation = new ReactNavigationInstrumentation({
                routeChangeTimeoutMs: 200,
            });
            const mockTransaction = getMockTransaction();
            const tracingListener = jest.fn(() => mockTransaction);
            instrumentation.registerRoutingInstrumentation(tracingListener, context => context, () => { });
            const mockNavigationContainerRef = {
                current: new MockNavigationContainer(),
            };
            return new Promise(resolve => {
                setTimeout(() => {
                    instrumentation.registerNavigationContainer(mockNavigationContainerRef);
                    expect(mockTransaction.sampled).toBe(false);
                    resolve();
                }, 210);
            });
        }));
    });
    describe('onRouteConfirmed', () => {
        test('onRouteConfirmed called with correct route data', () => {
            const instrumentation = new ReactNavigationInstrumentation();
            // Need a dummy transaction as the instrumentation will start a transaction right away when the first navigation container is attached.
            const mockTransactionDummy = getMockTransaction();
            const transactionRef = {
                current: mockTransactionDummy,
            };
            let confirmedContext;
            const tracingListener = jest.fn(() => transactionRef.current);
            instrumentation.registerRoutingInstrumentation(tracingListener, context => context, context => {
                confirmedContext = context;
            });
            const mockNavigationContainerRef = {
                current: new MockNavigationContainer(),
            };
            instrumentation.registerNavigationContainer(mockNavigationContainerRef);
            const mockTransaction = getMockTransaction();
            transactionRef.current = mockTransaction;
            mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
            const route1 = {
                name: 'New Route 1',
                key: '1',
                params: {
                    someParam: 42,
                },
            };
            mockNavigationContainerRef.current.currentRoute = route1;
            mockNavigationContainerRef.current.listeners['state']({});
            mockNavigationContainerRef.current.listeners['__unsafe_action__']({});
            const route2 = {
                name: 'New Route 2',
                key: '2',
                params: {
                    someParam: 42,
                },
            };
            mockNavigationContainerRef.current.currentRoute = route2;
            mockNavigationContainerRef.current.listeners['state']({});
            expect(confirmedContext).toBeDefined();
            if (confirmedContext) {
                expect(confirmedContext.name).toBe(route2.name);
                expect(confirmedContext.metadata).toBeUndefined();
                expect(confirmedContext.data).toBeDefined();
                if (confirmedContext.data) {
                    expect(confirmedContext.data.route.name).toBe(route2.name);
                    expect(confirmedContext.data.previousRoute).toBeDefined();
                    if (confirmedContext.data.previousRoute) {
                        expect(confirmedContext.data.previousRoute.name).toBe(route1.name);
                    }
                }
            }
        });
    });
});
