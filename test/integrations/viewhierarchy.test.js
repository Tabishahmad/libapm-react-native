var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ViewHierarchy } from '../../src/js/integrations/viewhierarchy';
import { NATIVE } from '../../src/js/wrapper';
jest.mock('../../src/js/wrapper');
describe('ViewHierarchy', () => {
    let integration;
    let mockEvent;
    beforeEach(() => {
        integration = new ViewHierarchy();
        mockEvent = {
            exception: {
                values: [
                    {
                        value: 'Mock Error Event',
                    },
                ],
            },
        };
    });
    it('integration event processor does not throw on native error', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchViewHierarchy.mockImplementation(() => {
            throw new Error('Test Error');
        });
        const mockHint = {};
        yield executeIntegrationFor(mockEvent, mockHint);
        expect(mockHint).toEqual({});
    }));
    it('returns unchanged event', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchViewHierarchy.mockImplementation(((() => Promise.resolve(new Uint8Array([])))));
        yield executeIntegrationFor(mockEvent);
        expect(mockEvent).toEqual({
            exception: {
                values: [
                    {
                        value: 'Mock Error Event',
                    },
                ],
            },
        });
    }));
    it('adds view hierarchy attachment in event hint', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchViewHierarchy.mockImplementation(((() => Promise.resolve(new Uint8Array([1, 2, 3])))));
        const mockHint = {};
        yield executeIntegrationFor(mockEvent, mockHint);
        expect(mockHint).toEqual({
            attachments: [
                {
                    filename: 'view-hierarchy.json',
                    contentType: 'application/json',
                    attachmentType: 'event.view_hierarchy',
                    data: new Uint8Array([1, 2, 3]),
                },
            ],
        });
    }));
    it('does not modify existing event hint attachments', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchViewHierarchy.mockImplementation(((() => Promise.resolve(new Uint8Array([1, 2, 3])))));
        const mockHint = {
            attachments: [
                {
                    filename: 'test-attachment.txt',
                    contentType: 'text/plain',
                    data: new Uint8Array([4, 5, 6]),
                },
            ],
        };
        yield executeIntegrationFor(mockEvent, mockHint);
        expect(mockHint).toEqual({
            attachments: [
                {
                    filename: 'view-hierarchy.json',
                    contentType: 'application/json',
                    attachmentType: 'event.view_hierarchy',
                    data: new Uint8Array([1, 2, 3]),
                },
                {
                    filename: 'test-attachment.txt',
                    contentType: 'text/plain',
                    data: new Uint8Array([4, 5, 6]),
                },
            ],
        });
    }));
    it('does not create empty view hierarchy attachment in event hint', () => __awaiter(void 0, void 0, void 0, function* () {
        NATIVE.fetchViewHierarchy.mockImplementation(((() => Promise.resolve(null))));
        const mockHint = {};
        yield executeIntegrationFor(mockEvent, mockHint);
        expect(mockHint).toEqual({});
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
