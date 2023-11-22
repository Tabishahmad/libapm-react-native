var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventOrigin } from '../../src/js/integrations';
describe('Event Origin', () => {
    it('Adds event.origin and event.environment javascript tags to events', done => {
        const integration = new EventOrigin();
        const mockEvent = {};
        integration.setupOnce((eventProcessor) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const processedEvent = yield eventProcessor(mockEvent, {});
                expect(processedEvent).toBeDefined();
                if (processedEvent) {
                    expect(processedEvent.tags).toBeDefined();
                    if (processedEvent.tags) {
                        expect(processedEvent.tags['event.origin']).toBe('javascript');
                        expect(processedEvent.tags['event.environment']).toBe('javascript');
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
