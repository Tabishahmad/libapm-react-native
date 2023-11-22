import { Transaction } from '@sentry/core';
import { rejectedSyncPromise } from '@sentry/utils';
import { getBlankTransactionContext } from '../src/js/tracing/utils';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockFunction(fn) {
    return fn;
}
export const getMockTransaction = (name) => {
    const transaction = new Transaction(getBlankTransactionContext(name));
    // Assume it's sampled
    transaction.sampled = true;
    return transaction;
};
export const firstArg = 0;
export const secondArg = 1;
export const envelopeHeader = 0;
export const envelopeItems = 1;
export const envelopeItemHeader = 0;
export const envelopeItemPayload = 1;
export const getMockSession = () => ({
    sid: 'sid_test_value',
    init: true,
    timestamp: -1,
    started: -1,
    status: 'ok',
    errors: -1,
    ignoreDuration: false,
    release: 'release_test_value',
    toJSON: () => ({
        init: true,
        sid: 'sid_test_value',
        timestamp: 'timestamp_test_value',
        started: 'started_test_value',
        status: 'ok',
        errors: -1,
    }),
});
export const getMockUserFeedback = () => ({
    comments: 'comments_test_value',
    email: 'email_test_value',
    name: 'name_test_value',
    event_id: 'event_id_test_value',
});
export const getSyncPromiseRejectOnFirstCall = (reason) => {
    let shouldSyncReject = true;
    return jest.fn((..._args) => {
        if (shouldSyncReject) {
            shouldSyncReject = false;
            return rejectedSyncPromise(reason);
        }
        else {
            return Promise.resolve();
        }
    });
};
