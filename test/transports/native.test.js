var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NativeTransport } from '../../src/js/transports/native';
jest.mock('../../src/js/wrapper', () => ({
    NATIVE: {
        sendEnvelope: jest.fn(() => Promise.resolve({ status: 200 })),
    },
}));
describe('NativeTransport', () => {
    test('call native sendEvent', () => __awaiter(void 0, void 0, void 0, function* () {
        const transport = new NativeTransport();
        yield expect(transport.send({})).resolves.toEqual({ status: 200 });
    }));
});
