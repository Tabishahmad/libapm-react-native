var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as mockWrapper from '../mockWrapper';
jest.mock('../../src/js/wrapper', () => mockWrapper);
jest.mock('../../src/js/utils/environment');
jest.mock('../../src/js/profiling/debugid');
import { getCurrentHub } from '@sentry/core';
import * as Sentry from '../../src/js';
import { HermesProfiling } from '../../src/js/integrations';
import { getDebugMetadata } from '../../src/js/profiling/debugid';
import { getDefaultEnvironment, isHermesEnabled } from '../../src/js/utils/environment';
import { RN_GLOBAL_OBJ } from '../../src/js/utils/worldwide';
import { MOCK_DSN } from '../mockDsn';
import { envelopeItemPayload, envelopeItems } from '../testutils';
import { createMockMinimalValidAppleProfile, createMockMinimalValidHermesProfile } from './fixtures';
const SEC_TO_MS = 1e6;
describe('profiling integration', () => {
    let mock;
    beforeEach(() => {
        isHermesEnabled.mockReturnValue(true);
        mockWrapper.NATIVE.startProfiling.mockReturnValue(true);
        mockWrapper.NATIVE.stopProfiling.mockReturnValue({
            hermesProfile: createMockMinimalValidHermesProfile(),
        });
        getDebugMetadata.mockReturnValue([
            {
                code_file: 'test.app.map',
                debug_id: '123',
                type: 'sourcemap',
            },
        ]);
        jest.useFakeTimers();
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        jest.runAllTimers();
        jest.useRealTimers();
        RN_GLOBAL_OBJ.__SENTRY__.globalEventProcessors = []; // resets integrations
        yield Sentry.close();
    }));
    test('should start profile if there is a transaction running when integration is created', () => {
        var _a, _b, _c, _d;
        mock = initTestClient({ withProfiling: false });
        jest.runAllTimers();
        jest.clearAllMocks();
        const transaction = Sentry.startTransaction({
            name: 'test-name',
        });
        (_a = getCurrentHub().getScope()) === null || _a === void 0 ? void 0 : _a.setSpan(transaction);
        (_c = (_b = getCurrentHub().getClient()) === null || _b === void 0 ? void 0 : _b.addIntegration) === null || _c === void 0 ? void 0 : _c.call(_b, new HermesProfiling());
        transaction.finish();
        jest.runAllTimers();
        expectEnveloperToContainProfile((_d = mock.transportSendMock.mock.lastCall) === null || _d === void 0 ? void 0 : _d[0], 'test-name', transaction.traceId);
    });
    describe('environment', () => {
        beforeEach(() => {
            getDefaultEnvironment.mockReturnValue('mocked');
            mockWrapper.NATIVE.fetchNativeDeviceContexts.mockResolvedValue({
                environment: 'native',
            });
        });
        const expectTransactionWithEnvironment = (envelope, env) => {
            const transactionEvent = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][0][envelopeItemPayload];
            expect(transactionEvent).toEqual(expect.objectContaining({
                environment: env,
            }));
        };
        const expectProfileWithEnvironment = (envelope, env) => {
            const profileEvent = (envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][1])[1];
            expect(profileEvent).toEqual(expect.objectContaining({
                environment: env,
            }));
        };
        test('should use default environment for transaction and profile', () => {
            var _a;
            mock = initTestClient();
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
            expectTransactionWithEnvironment(envelope, 'mocked');
            expectProfileWithEnvironment(envelope, 'mocked');
        });
        test('should use native environment for transaction and profile if user value is nullish', () => {
            var _a;
            mock = initTestClient({ withProfiling: true, environment: '' });
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
            expectTransactionWithEnvironment(envelope, 'native');
            expectProfileWithEnvironment(envelope, 'native');
        });
        test('should keep nullish for transaction and profile uses default', () => {
            var _a;
            mockWrapper.NATIVE.fetchNativeDeviceContexts.mockResolvedValue({
                environment: undefined,
            });
            mock = initTestClient({ withProfiling: true, environment: undefined });
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
            expectTransactionWithEnvironment(envelope, undefined);
            expectProfileWithEnvironment(envelope, 'mocked');
        });
        test('should keep custom environment for transaction and profile', () => {
            var _a;
            mock = initTestClient({ withProfiling: true, environment: 'custom' });
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
            expectTransactionWithEnvironment(envelope, 'custom');
            expectProfileWithEnvironment(envelope, 'custom');
        });
    });
    describe('with profiling enabled', () => {
        beforeEach(() => {
            mock = initTestClient();
            jest.runAllTimers();
            jest.clearAllMocks();
        });
        describe('with native profiling', () => {
            beforeEach(() => {
                mockWrapper.NATIVE.stopProfiling.mockReturnValue({
                    hermesProfile: createMockMinimalValidHermesProfile(),
                    nativeProfile: createMockMinimalValidAppleProfile(),
                });
            });
            test('should create a new mixed profile and add it to the transaction envelope', () => {
                var _a;
                const transaction = Sentry.startTransaction({
                    name: 'test-name',
                });
                transaction.finish();
                jest.runAllTimers();
                const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
                expectEnveloperToContainProfile(envelope, 'test-name', transaction.traceId);
                // Expect merged profile
                expect(getProfileFromEnvelope(envelope)).toEqual(expect.objectContaining({
                    debug_meta: {
                        images: [
                            {
                                code_file: 'test.app.map',
                                debug_id: '123',
                                type: 'sourcemap',
                            },
                            {
                                type: 'macho',
                                code_file: 'test.app',
                                debug_id: '123',
                                image_addr: '0x0000000000000002',
                                image_size: 100,
                            },
                        ],
                    },
                    profile: expect.objectContaining({
                        frames: [
                            {
                                function: '[root]',
                                in_app: false,
                            },
                            {
                                instruction_addr: '0x0000000000000003',
                                platform: 'cocoa',
                            },
                            {
                                instruction_addr: '0x0000000000000004',
                                platform: 'cocoa',
                            },
                        ],
                    }),
                }));
            });
        });
        test('should create a new profile and add in to the transaction envelope', () => {
            var _a;
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            expectEnveloperToContainProfile((_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0], 'test-name', transaction.traceId);
        });
        test('should finish previous profile when a new transaction starts', () => {
            const transaction1 = Sentry.startTransaction({
                name: 'test-name-1',
            });
            const transaction2 = Sentry.startTransaction({
                name: 'test-name-2',
            });
            transaction1.finish();
            transaction2.finish();
            jest.runAllTimers();
            expectEnveloperToContainProfile(mock.transportSendMock.mock.calls[0][0], 'test-name-1', transaction1.traceId);
            expectEnveloperToContainProfile(mock.transportSendMock.mock.calls[1][0], 'test-name-2', transaction2.traceId);
        });
        test('profile should start at the same time as transaction', () => {
            var _a;
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            transaction.finish();
            jest.runAllTimers();
            const envelope = (_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0];
            const transactionEnvelopeItemPayload = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][0][envelopeItemPayload];
            const profileEnvelopeItemPayload = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][1][envelopeItemPayload];
            const transactionStart = Math.floor(transactionEnvelopeItemPayload.start_timestamp * SEC_TO_MS);
            const profileStart = new Date(profileEnvelopeItemPayload.timestamp).getTime();
            expect(profileStart - transactionStart).toBeLessThan(10);
        });
        test('profile is only recorded until max duration is reached', () => {
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            jest.clearAllMocks();
            jest.advanceTimersByTime(40 * 1e6);
            expect(mockWrapper.NATIVE.stopProfiling.mock.calls.length).toEqual(1);
            transaction.finish();
        });
        test('profile that reached max duration is sent', () => {
            var _a;
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            jest.advanceTimersByTime(40 * 1e6);
            transaction.finish();
            jest.runAllTimers();
            expectEnveloperToContainProfile((_a = mock.transportSendMock.mock.lastCall) === null || _a === void 0 ? void 0 : _a[0], 'test-name', transaction.traceId);
        });
        test('profile timeout is reset when transaction is finished', () => {
            const integration = getCurrentHermesProfilingIntegration();
            const transaction = Sentry.startTransaction({
                name: 'test-name',
            });
            const timeoutAfterProfileStarted = integration._currentProfileTimeout;
            jest.advanceTimersByTime(40 * 1e6);
            transaction.finish();
            const timeoutAfterProfileFinished = integration._currentProfileTimeout;
            jest.runAllTimers();
            expect(timeoutAfterProfileStarted).toBeDefined();
            expect(timeoutAfterProfileFinished).toBeUndefined();
        });
    });
});
function getCurrentHermesProfilingIntegration() {
    var _a;
    const integration = (_a = Sentry.getCurrentHub().getClient()) === null || _a === void 0 ? void 0 : _a.getIntegration(HermesProfiling);
    if (!integration) {
        throw new Error('HermesProfiling integration is not installed');
    }
    return integration;
}
function initTestClient(testOptions = {
    withProfiling: true,
}) {
    var _a;
    const transportSendMock = jest.fn();
    const options = {
        dsn: MOCK_DSN,
        _experiments: {
            profilesSampleRate: 1,
        },
        integrations: integrations => {
            if (!testOptions.withProfiling) {
                return integrations.filter(i => i.name !== 'HermesProfiling');
            }
            return integrations;
        },
        transport: () => ({
            send: transportSendMock.mockResolvedValue(undefined),
            flush: jest.fn().mockResolvedValue(true),
        }),
    };
    if ('environment' in testOptions) {
        options.environment = testOptions.environment;
    }
    Sentry.init(options);
    // In production integrations are setup only once, but in the tests we want them to setup on every init
    const integrations = (_a = Sentry.getCurrentHub().getClient()) === null || _a === void 0 ? void 0 : _a.getOptions().integrations;
    if (integrations) {
        for (const integration of integrations) {
            integration.setupOnce(Sentry.addGlobalEventProcessor, Sentry.getCurrentHub);
        }
    }
    return {
        transportSendMock,
    };
}
function expectEnveloperToContainProfile(envelope, name, traceId) {
    const transactionEnvelopeItemPayload = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][0][envelopeItemPayload];
    const profileEnvelopeItem = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems][1];
    expect(profileEnvelopeItem).toEqual([
        { type: 'profile' },
        expect.objectContaining({
            event_id: expect.any(String),
            transaction: expect.objectContaining({
                name,
                id: transactionEnvelopeItemPayload.event_id,
                trace_id: traceId,
            }),
        }),
    ]);
}
function getProfileFromEnvelope(envelope) {
    var _a, _b;
    return (_b = (_a = envelope === null || envelope === void 0 ? void 0 : envelope[envelopeItems]) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b[1];
}
