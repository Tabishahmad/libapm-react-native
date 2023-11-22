var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCurrentHub, getMainCarrier } from '@sentry/core';
import { _addTracingExtensions } from '../src/js/measurements';
describe('Tracing extensions', () => {
    let hub;
    let carrier;
    let startTransaction;
    beforeEach(() => {
        var _a, _b;
        _addTracingExtensions();
        hub = getCurrentHub();
        carrier = getMainCarrier();
        startTransaction = (_b = (_a = carrier.__SENTRY__) === null || _a === void 0 ? void 0 : _a.extensions) === null || _b === void 0 ? void 0 : _b.startTransaction;
    });
    test('transaction has default op', () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = startTransaction === null || startTransaction === void 0 ? void 0 : startTransaction.apply(hub, [{}]);
        expect(transaction).toEqual(expect.objectContaining({ op: 'default' }));
    }));
    test('transaction does not overwrite custom op', () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = startTransaction === null || startTransaction === void 0 ? void 0 : startTransaction.apply(hub, [{ op: 'custom' }]);
        expect(transaction).toEqual(expect.objectContaining({ op: 'custom' }));
    }));
    test('transaction start span creates default op', () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = startTransaction === null || startTransaction === void 0 ? void 0 : startTransaction.apply(hub, [{ op: 'custom' }]);
        const span = transaction === null || transaction === void 0 ? void 0 : transaction.startChild();
        expect(span).toEqual(expect.objectContaining({ op: 'default' }));
    }));
    test('transaction start span keeps custom op', () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = startTransaction === null || startTransaction === void 0 ? void 0 : startTransaction.apply(hub, [{ op: 'custom' }]);
        const span = transaction === null || transaction === void 0 ? void 0 : transaction.startChild({ op: 'custom' });
        expect(span).toEqual(expect.objectContaining({ op: 'custom' }));
    }));
    test('transaction start span passes correct values to the child', () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = startTransaction === null || startTransaction === void 0 ? void 0 : startTransaction.apply(hub, [{ op: 'custom' }]);
        const span = transaction === null || transaction === void 0 ? void 0 : transaction.startChild({ op: 'custom' });
        expect(span).toEqual(expect.objectContaining({
            transaction,
            parentSpanId: transaction.spanId,
            sampled: transaction.sampled,
            traceId: transaction.traceId,
        }));
    }));
});
