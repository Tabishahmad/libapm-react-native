var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable import/no-unresolved */
import { expect } from '@jest/globals';
const RETRY_TIMEOUT_MS = 1000;
const FINAL_TIMEOUT_MS = 1 * 60 * 1000;
export function waitForTruthyResult(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const promise = new Promise((resolve, reject) => {
            // eslint-disable-next-line prefer-const
            let timeout;
            // eslint-disable-next-line prefer-const
            let interval;
            // eslint-disable-next-line prefer-const
            interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const result = yield value();
                if (result) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    resolve(result);
                }
            }), RETRY_TIMEOUT_MS);
            // eslint-disable-next-line prefer-const
            timeout = setTimeout(() => {
                clearInterval(interval);
                reject(new Error(`waitForTruthyResult function timed out after ${FINAL_TIMEOUT_MS} ms`));
            }, FINAL_TIMEOUT_MS);
        });
        yield expect(promise).resolves.toBeTruthy();
    });
}
