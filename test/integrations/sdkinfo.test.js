var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SDK_NAME, SDK_VERSION } from '../../src/js';
import { SdkInfo } from '../../src/js/integrations';
import { NATIVE } from '../../src/js/wrapper';
let mockedFetchNativeSdkInfo;
const mockCocoaPackage = {
    name: 'sentry-cocoa',
    version: '0.0.1',
};
const mockAndroidPackage = {
    name: 'sentry-android',
    version: '0.0.1',
};
jest.mock('../../src/js/wrapper', () => {
    const actual = jest.requireActual('../../src/js/wrapper');
    return {
        NATIVE: Object.assign(Object.assign({}, actual.NATIVE), { platform: 'ios', fetchNativeSdkInfo: () => mockedFetchNativeSdkInfo() }),
    };
});
describe('Sdk Info', () => {
    afterEach(() => {
        NATIVE.platform = 'ios';
    });
    it('Adds native package and javascript platform to event on iOS', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        mockedFetchNativeSdkInfo = jest.fn().mockResolvedValue(mockCocoaPackage);
        const mockEvent = {};
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect((_a = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _a === void 0 ? void 0 : _a.packages).toEqual(expect.arrayContaining([mockCocoaPackage]));
        expect((processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.platform) === 'javascript');
        expect(mockedFetchNativeSdkInfo).toBeCalledTimes(1);
    }));
    it('Adds native package and javascript platform to event on Android', () => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        NATIVE.platform = 'android';
        mockedFetchNativeSdkInfo = jest.fn().mockResolvedValue(mockAndroidPackage);
        const mockEvent = {};
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect((_b = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _b === void 0 ? void 0 : _b.packages).toEqual(expect.not.arrayContaining([mockCocoaPackage]));
        expect((processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.platform) === 'javascript');
        expect(mockedFetchNativeSdkInfo).toBeCalledTimes(1);
    }));
    it('Does not add any default non native packages', () => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        mockedFetchNativeSdkInfo = jest.fn().mockResolvedValue(null);
        const mockEvent = {};
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect((_c = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _c === void 0 ? void 0 : _c.packages).toEqual([]);
        expect((processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.platform) === 'javascript');
        expect(mockedFetchNativeSdkInfo).toBeCalledTimes(1);
    }));
    it('Does not overwrite existing sdk name and version', () => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e;
        mockedFetchNativeSdkInfo = jest.fn().mockResolvedValue(null);
        const mockEvent = {
            sdk: {
                name: 'test-sdk',
                version: '1.0.0',
            },
        };
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect((_d = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _d === void 0 ? void 0 : _d.name).toEqual('test-sdk');
        expect((_e = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _e === void 0 ? void 0 : _e.version).toEqual('1.0.0');
    }));
    it('Does use default sdk name and version', () => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g;
        mockedFetchNativeSdkInfo = jest.fn().mockResolvedValue(null);
        const mockEvent = {};
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect((_f = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _f === void 0 ? void 0 : _f.name).toEqual(SDK_NAME);
        expect((_g = processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.sdk) === null || _g === void 0 ? void 0 : _g.version).toEqual(SDK_VERSION);
    }));
});
function executeIntegrationFor(mockedEvent, mockedHint = {}) {
    const integration = new SdkInfo();
    return new Promise((resolve, reject) => {
        integration.setupOnce((eventProcessor) => __awaiter(this, void 0, void 0, function* () {
            try {
                const processedEvent = yield eventProcessor(mockedEvent, mockedHint);
                resolve(processedEvent);
            }
            catch (e) {
                reject(e);
            }
        }));
    });
}
