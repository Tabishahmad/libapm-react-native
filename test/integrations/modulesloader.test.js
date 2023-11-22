var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ModulesLoader } from '../../src/js/integrations';
import { NATIVE } from '../../src/js/wrapper';
jest.mock('../../src/js/wrapper');
describe('Modules Loader', () => {
    let integration;
    beforeEach(() => {
        integration = new ModulesLoader();
    });
    it('integration event processor does not throw on native error', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchModules.mockImplementation(() => {
            throw new Error('Test Error');
        });
        const mockEvent = {
            modules: {
                eventModule: 'eventModuleVersion',
            },
        };
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect(processedEvent).toEqual(mockEvent);
    }));
    it('merges event modules with native modules', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchModules.mockImplementation(() => ({
            nativeModules: 'nativeModuleVersion',
            duplicateModule: 'duplicateNativeModuleVersion',
        }));
        const mockEvent = {
            modules: {
                eventModule: 'eventModuleVersion',
                duplicateModule: 'duplicateEventModuleVersion',
            },
        };
        const processedEvent = yield executeIntegrationFor(mockEvent);
        expect(processedEvent === null || processedEvent === void 0 ? void 0 : processedEvent.modules).toEqual({
            eventModule: 'eventModuleVersion',
            nativeModules: 'nativeModuleVersion',
            duplicateModule: 'duplicateEventModuleVersion',
        });
    }));
    function executeIntegrationFor(mockedEvent, mockedHint = {}) {
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
});
