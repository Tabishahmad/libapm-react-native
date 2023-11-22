var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
const domain = 'sentry.io';
const eventEndpoint = '/api/0/projects/sentry-sdks/sentry-react-native/events/';
const RETRY_COUNT = 600;
const RETRY_INTERVAL = 1000;
const fetchEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://${domain}${eventEndpoint}${eventId}/`;
    expect(process.env.SENTRY_AUTH_TOKEN).toBeDefined();
    expect(process.env.SENTRY_AUTH_TOKEN.length).toBeGreaterThan(0);
    const request = new fetch.Request(url, {
        headers: {
            Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'GET',
    });
    let retries = 0;
    const retryer = (jsonResponse) => new Promise((resolve, reject) => {
        if (jsonResponse.detail === 'Event not found') {
            if (retries < RETRY_COUNT) {
                setTimeout(() => {
                    retries++;
                    // eslint-disable-next-line no-console
                    console.log(`Retrying api request. Retry number: ${retries}`);
                    resolve(fetch(request)
                        .then(res => res.json())
                        .then(retryer));
                }, RETRY_INTERVAL);
            }
            else {
                reject(new Error('Could not fetch event within retry limit.'));
            }
        }
        else {
            resolve(jsonResponse);
        }
    });
    const json = yield fetch(request)
        // tslint:disable-next-line: no-unsafe-any
        .then(res => res.json())
        .then(retryer);
    return json;
});
export { fetchEvent };
