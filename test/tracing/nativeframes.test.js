var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Transaction } from '@sentry/core';
import { NativeFramesInstrumentation } from '../../src/js/tracing/nativeframes';
import { NATIVE } from '../../src/js/wrapper';
import { mockFunction } from '../testutils';
jest.mock('../../src/js/wrapper', () => {
    return {
        NATIVE: {
            fetchNativeFrames: jest.fn(),
            disableNativeFramesTracking: jest.fn(),
            enableNative: true,
        },
    };
});
describe('NativeFramesInstrumentation', () => {
    it('Sets start frames to trace context on transaction start.', done => {
        const startFrames = {
            totalFrames: 100,
            slowFrames: 20,
            frozenFrames: 5,
        };
        mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(startFrames);
        const instance = new NativeFramesInstrumentation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _eventProcessor => { }, () => true);
        const transaction = new Transaction({ name: 'test' });
        instance.onTransactionStart(transaction);
        setImmediate(() => {
            var _a;
            expect(transaction.data.__startFrames).toMatchObject(startFrames);
            expect((_a = transaction.getTraceContext().data) === null || _a === void 0 ? void 0 : _a.__startFrames).toMatchObject(startFrames);
            done();
        });
    });
    it('Sets measurements on the transaction event and removes startFrames from trace context.', done => {
        const startFrames = {
            totalFrames: 100,
            slowFrames: 20,
            frozenFrames: 5,
        };
        const finishFrames = {
            totalFrames: 200,
            slowFrames: 40,
            frozenFrames: 10,
        };
        mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(startFrames);
        let eventProcessor;
        const instance = new NativeFramesInstrumentation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _eventProcessor => {
            eventProcessor = _eventProcessor;
        }, () => true);
        const transaction = new Transaction({ name: 'test' });
        instance.onTransactionStart(transaction);
        setImmediate(() => {
            mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(finishFrames);
            const finishTimestamp = Date.now() / 1000;
            instance.onTransactionFinish(transaction);
            setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                try {
                    expect(eventProcessor).toBeDefined();
                    if (eventProcessor) {
                        const event = yield eventProcessor({
                            event_id: '0',
                            type: 'transaction',
                            transaction: transaction.name,
                            contexts: {
                                trace: transaction.getTraceContext(),
                            },
                            start_timestamp: finishTimestamp - 10,
                            timestamp: finishTimestamp,
                        }, {});
                        // This setImmediate needs to be here for the assertions to not be caught by the promise handler.
                        expect(event).toBeDefined();
                        if (event) {
                            expect(event.measurements).toBeDefined();
                            if (event.measurements) {
                                expect(event.measurements.frames_total.value).toBe(finishFrames.totalFrames - startFrames.totalFrames);
                                expect(event.measurements.frames_total.unit).toBe('none');
                                expect(event.measurements.frames_slow.value).toBe(finishFrames.slowFrames - startFrames.slowFrames);
                                expect(event.measurements.frames_slow.unit).toBe('none');
                                expect(event.measurements.frames_frozen.value).toBe(finishFrames.frozenFrames - startFrames.frozenFrames);
                                expect(event.measurements.frames_frozen.unit).toBe('none');
                            }
                            expect((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data).toBeDefined();
                            if ((_d = (_c = event.contexts) === null || _c === void 0 ? void 0 : _c.trace) === null || _d === void 0 ? void 0 : _d.data) {
                                expect(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                event.contexts.trace.data.__startFrames).toBeUndefined();
                            }
                        }
                    }
                    done();
                }
                catch (e) {
                    done(e);
                }
            }));
        });
    });
    it('Does not set measurements on transactions without startFrames.', done => {
        const finishFrames = {
            totalFrames: 200,
            slowFrames: 40,
            frozenFrames: 10,
        };
        mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(finishFrames);
        let eventProcessor;
        const instance = new NativeFramesInstrumentation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _eventProcessor => {
            eventProcessor = _eventProcessor;
        }, () => true);
        const transaction = new Transaction({ name: 'test' });
        transaction.setData('test', {});
        setImmediate(() => {
            const finishTimestamp = Date.now() / 1000;
            instance.onTransactionFinish(transaction);
            setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
                expect(eventProcessor).toBeDefined();
                if (eventProcessor) {
                    const event = yield eventProcessor({
                        event_id: '0',
                        type: 'transaction',
                        transaction: transaction.name,
                        contexts: {
                            trace: transaction.getTraceContext(),
                        },
                        start_timestamp: finishTimestamp - 10,
                        timestamp: finishTimestamp,
                        measurements: {},
                    }, {});
                    // This setImmediate needs to be here for the assertions to not be caught by the promise handler.
                    setImmediate(() => {
                        var _a, _b, _c, _d;
                        expect(event).toBeDefined();
                        if (event) {
                            expect(event.measurements).toBeDefined();
                            if (event.measurements) {
                                expect(event.measurements.frames_total).toBeUndefined();
                                expect(event.measurements.frames_slow).toBeUndefined();
                                expect(event.measurements.frames_frozen).toBeUndefined();
                            }
                            expect((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data).toBeDefined();
                            if ((_d = (_c = event.contexts) === null || _c === void 0 ? void 0 : _c.trace) === null || _d === void 0 ? void 0 : _d.data) {
                                expect(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                event.contexts.trace.data.__startFrames).toBeUndefined();
                            }
                        }
                        done();
                    });
                }
            }));
        });
    });
    it('Sets measurements on the transaction event and removes startFrames if finishFrames is null.', done => {
        const startFrames = {
            totalFrames: 100,
            slowFrames: 20,
            frozenFrames: 5,
        };
        const finishFrames = null;
        mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(startFrames);
        let eventProcessor;
        const instance = new NativeFramesInstrumentation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _eventProcessor => {
            eventProcessor = _eventProcessor;
        }, () => true);
        const transaction = new Transaction({ name: 'test' });
        instance.onTransactionStart(transaction);
        setImmediate(() => {
            mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(finishFrames);
            const finishTimestamp = Date.now() / 1000;
            instance.onTransactionFinish(transaction);
            setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                try {
                    expect(eventProcessor).toBeDefined();
                    if (eventProcessor) {
                        const event = yield eventProcessor({
                            event_id: '0',
                            type: 'transaction',
                            transaction: transaction.name,
                            contexts: {
                                trace: transaction.getTraceContext(),
                            },
                            start_timestamp: finishTimestamp - 10,
                            timestamp: finishTimestamp,
                        }, {});
                        expect(event).toBeDefined();
                        if (event) {
                            expect(event.measurements).toBeUndefined();
                            expect((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data).toBeDefined();
                            if ((_d = (_c = event.contexts) === null || _c === void 0 ? void 0 : _c.trace) === null || _d === void 0 ? void 0 : _d.data) {
                                expect(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                event.contexts.trace.data.__startFrames).toBeUndefined();
                            }
                        }
                    }
                    done();
                }
                catch (e) {
                    done(e);
                }
            }));
        });
    });
    it('Does not set measurements on the transaction event and removes startFrames if finishFrames times out.', done => {
        const startFrames = {
            totalFrames: 100,
            slowFrames: 20,
            frozenFrames: 5,
        };
        mockFunction(NATIVE.fetchNativeFrames).mockResolvedValue(startFrames);
        let eventProcessor;
        const instance = new NativeFramesInstrumentation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _eventProcessor => {
            eventProcessor = _eventProcessor;
        }, () => true);
        const transaction = new Transaction({ name: 'test' });
        instance.onTransactionStart(transaction);
        setImmediate(() => {
            mockFunction(NATIVE.fetchNativeFrames).mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => __awaiter(void 0, void 0, void 0, function* () { return new Promise(() => { }); }));
            const finishTimestamp = Date.now() / 1000;
            instance.onTransactionFinish(transaction);
            setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                try {
                    expect(eventProcessor).toBeDefined();
                    if (eventProcessor) {
                        const event = yield eventProcessor({
                            event_id: '0',
                            type: 'transaction',
                            transaction: transaction.name,
                            contexts: {
                                trace: transaction.getTraceContext(),
                            },
                            start_timestamp: finishTimestamp - 10,
                            timestamp: finishTimestamp,
                        }, {});
                        expect(event).toBeDefined();
                        if (event) {
                            expect(event.measurements).toBeUndefined();
                            expect((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data).toBeDefined();
                            if ((_d = (_c = event.contexts) === null || _c === void 0 ? void 0 : _c.trace) === null || _d === void 0 ? void 0 : _d.data) {
                                expect(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                event.contexts.trace.data.__startFrames).toBeUndefined();
                            }
                        }
                    }
                    done();
                }
                catch (e) {
                    done(e);
                }
            }));
        });
    });
});
