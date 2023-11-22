var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DeviceContext } from '../../src/js/integrations';
import { NATIVE } from '../../src/js/wrapper';
let mockCurrentAppState = 'unknown';
jest.mock('../../src/js/wrapper');
jest.mock('react-native', () => ({
    AppState: new Proxy({}, { get: () => mockCurrentAppState }),
    NativeModules: {},
    Platform: {},
}));
describe('Device Context Integration', () => {
    let integration;
    const mockGetCurrentHub = () => ({
        getIntegration: () => integration,
    });
    beforeEach(() => {
        integration = new DeviceContext();
    });
    it('add native user', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { user: { id: 'native-user' } },
        })).expectEvent.toStrictEqualToNativeContexts();
    }));
    it('do not overwrite event user', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { user: { id: 'native-user' } },
            mockEvent: { user: { id: 'event-user' } },
        })).expectEvent.toStrictEqualMockEvent();
    }));
    it('do not overwrite event app context', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { app: { view_names: ['native view'] } },
            mockEvent: { contexts: { app: { view_names: ['Home'] } } },
        })).expectEvent.toStrictEqualMockEvent();
    }));
    it('merge event context app', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { app: { native: 'value' } } },
            mockEvent: { contexts: { app: { event_app: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                app: {
                    event_app: 'value',
                    native: 'value',
                },
            },
        });
    }));
    it('merge event context app even when event app doesnt exist', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { app: { native: 'value' } } },
            mockEvent: { contexts: { keyContext: { key: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                keyContext: {
                    key: 'value',
                },
                app: {
                    native: 'value',
                },
            },
        });
    }));
    it('merge event and native contexts', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { duplicate: { context: 'native-value' }, native: { context: 'value' } } },
            mockEvent: { contexts: { duplicate: { context: 'event-value' }, event: { context: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                duplicate: { context: 'event-value' },
                native: { context: 'value' },
                event: { context: 'value' },
            },
        });
    }));
    it('merge native tags', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { tags: { duplicate: 'native-tag', native: 'tag' } },
            mockEvent: { tags: { duplicate: 'event-tag', event: 'tag' } },
        });
        expect(processedEvent).toStrictEqual({
            tags: {
                duplicate: 'event-tag',
                native: 'tag',
                event: 'tag',
            },
        });
    }));
    it('merge native extra', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { extra: { duplicate: 'native-extra', native: 'extra' } },
            mockEvent: { extra: { duplicate: 'event-extra', event: 'extra' } },
        });
        expect(processedEvent).toStrictEqual({
            extra: {
                duplicate: 'event-extra',
                native: 'extra',
                event: 'extra',
            },
        });
    }));
    it('merge fingerprints', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { fingerprint: ['duplicate-fingerprint', 'native-fingerprint'] },
            mockEvent: { fingerprint: ['duplicate-fingerprint', 'event-fingerprint'] },
        });
        expect(processedEvent).toStrictEqual({
            fingerprint: ['duplicate-fingerprint', 'event-fingerprint', 'native-fingerprint'],
        });
    }));
    it('add native level', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { level: 'fatal' },
        })).expectEvent.toStrictEqualToNativeContexts();
    }));
    it('do not overwrite event level', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { level: 'native-level' },
            mockEvent: { level: 'info' },
        })).expectEvent.toStrictEqualMockEvent();
    }));
    it('add native environment', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { environment: 'native-environment' },
        })).expectEvent.toStrictEqualToNativeContexts();
    }));
    it('do not overwrite event environment', () => __awaiter(void 0, void 0, void 0, function* () {
        (yield executeIntegrationWith({
            nativeContexts: { environment: 'native-environment' },
            mockEvent: { environment: 'event-environment' },
        })).expectEvent.toStrictEqualMockEvent();
    }));
    it('use only native breadcrumbs', () => __awaiter(void 0, void 0, void 0, function* () {
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { breadcrumbs: [{ message: 'duplicate-breadcrumb' }, { message: 'native-breadcrumb' }] },
            mockEvent: { breadcrumbs: [{ message: 'duplicate-breadcrumb' }, { message: 'event-breadcrumb' }] },
        });
        expect(processedEvent).toStrictEqual({
            breadcrumbs: [{ message: 'duplicate-breadcrumb' }, { message: 'native-breadcrumb' }],
        });
    }));
    it('adds in_foreground false to native app contexts', () => __awaiter(void 0, void 0, void 0, function* () {
        mockCurrentAppState = 'background';
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { app: { native: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                app: {
                    native: 'value',
                    in_foreground: false,
                },
            },
        });
    }));
    it('adds in_foreground to native app contexts', () => __awaiter(void 0, void 0, void 0, function* () {
        mockCurrentAppState = 'active';
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { app: { native: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                app: {
                    native: 'value',
                    in_foreground: true,
                },
            },
        });
    }));
    it('do not add in_foreground if unknown', () => __awaiter(void 0, void 0, void 0, function* () {
        mockCurrentAppState = 'unknown';
        const { processedEvent } = yield executeIntegrationWith({
            nativeContexts: { contexts: { app: { native: 'value' } } },
        });
        expect(processedEvent).toStrictEqual({
            contexts: {
                app: {
                    native: 'value',
                },
            },
        });
    }));
    function executeIntegrationWith({ nativeContexts, mockEvent, }) {
        return __awaiter(this, void 0, void 0, function* () {
            NATIVE.fetchNativeDeviceContexts.mockImplementation(() => Promise.resolve(nativeContexts));
            const originalNativeContexts = Object.assign({}, nativeContexts);
            const originalMockEvent = Object.assign({}, mockEvent);
            const processedEvent = yield executeIntegrationFor(mockEvent !== null && mockEvent !== void 0 ? mockEvent : {});
            return {
                processedEvent,
                expectEvent: {
                    toStrictEqualToNativeContexts: () => expect(processedEvent).toStrictEqual(originalNativeContexts),
                    toStrictEqualMockEvent: () => expect(processedEvent).toStrictEqual(originalMockEvent),
                },
            };
        });
    }
    function executeIntegrationFor(mockedEvent) {
        return new Promise((resolve, reject) => {
            integration.setupOnce((eventProcessor) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const processedEvent = yield eventProcessor(mockedEvent, {});
                    resolve(processedEvent);
                }
                catch (e) {
                    reject(e);
                }
            }), mockGetCurrentHub);
        });
    }
});
