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
import path from 'path';
import { remote } from 'webdriverio';
import { fetchEvent } from './utils/fetchEvent';
import { waitForTruthyResult } from './utils/waitFor';
const DRIVER_NOT_INITIALIZED = 'Driver not initialized';
const T_20_MINUTES_IN_MS = 20 * 60e3;
jest.setTimeout(T_20_MINUTES_IN_MS);
let driver = null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function getElement(accessibilityId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!driver) {
            throw new Error(DRIVER_NOT_INITIALIZED);
        }
        const element = yield driver.$(`~${accessibilityId}`);
        yield element.waitForDisplayed({ timeout: 60000 });
        return element;
    });
}
function waitForEventId() {
    return __awaiter(this, void 0, void 0, function* () {
        const element = yield getElement('eventId');
        let value;
        yield waitForTruthyResult(() => __awaiter(this, void 0, void 0, function* () {
            value = yield element.getText();
            return value.length > 0;
        }));
        return value;
    });
}
function waitUntilEventIdIsEmpty() {
    return __awaiter(this, void 0, void 0, function* () {
        const element = yield getElement('eventId');
        yield waitForTruthyResult(() => __awaiter(this, void 0, void 0, function* () { return (yield element.getText()).length === 0; }));
    });
}
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const conf = {
        logLevel: 'info',
        port: 4723,
        capabilities: {},
    };
    if (process.env.APPIUM_APP === undefined) {
        throw new Error('APPIUM_APP environment variable must be set');
    }
    if (process.env.PLATFORM === 'ios' && process.env.APPIUM_DERIVED_DATA === undefined) {
        throw new Error('APPIUM_DERIVED_DATA environment variable must be set');
    }
    if (process.env.PLATFORM === 'android') {
        conf.capabilities = {
            platformName: 'Android',
            'appium:automationName': 'UIAutomator2',
            'appium:app': process.env.APPIUM_APP,
        };
    }
    else {
        conf.capabilities = {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:app': process.env.APPIUM_APP,
            // DerivedData of the WebDriverRunner Xcode project.
            'appium:derivedDataPath': path.resolve(process.env.APPIUM_DERIVED_DATA || ''),
            'appium:showXcodeLog': true,
            'appium:usePrebuiltWDA': true,
        };
    }
    if (process.env.DEVICE !== undefined) {
        conf.capabilities['appium:deviceName'] = process.env.DEVICE;
    }
    // 5 minutes - to accommodate the timeouts for things like getting events from Sentry.
    conf.capabilities['appium:newCommandTimeout'] = 300000;
    driver = yield remote(conf);
    const maxInitTries = 3;
    for (let i = 1; i <= maxInitTries; i++) {
        if (i === maxInitTries) {
            yield getElement('eventId');
        }
        else {
            try {
                yield getElement('eventId');
                break;
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.log(error);
            }
        }
    }
}));
describe('End to end tests for common events', () => {
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (driver === null || driver === void 0 ? void 0 : driver.deleteSession());
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const element = yield getElement('clearEventId');
        yield element.click();
        yield waitUntilEventIdIsEmpty();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const testName = expect.getState().currentTestName;
        const fileName = `screen-${testName}.png`.replace(/[^0-9a-zA-Z-+.]/g, '_');
        yield (driver === null || driver === void 0 ? void 0 : driver.saveScreenshot(fileName));
    }));
    test('captureMessage', () => __awaiter(void 0, void 0, void 0, function* () {
        const element = yield getElement('captureMessage');
        yield element.click();
        const eventId = yield waitForEventId();
        const sentryEvent = yield fetchEvent(eventId);
        expect(sentryEvent.eventID).toMatch(eventId);
    }));
    test('captureException', () => __awaiter(void 0, void 0, void 0, function* () {
        const element = yield getElement('captureException');
        yield element.click();
        const eventId = yield waitForEventId();
        const sentryEvent = yield fetchEvent(eventId);
        expect(sentryEvent.eventID).toMatch(eventId);
    }));
    test('unhandledPromiseRejection', () => __awaiter(void 0, void 0, void 0, function* () {
        const element = yield getElement('unhandledPromiseRejection');
        yield element.click();
        const eventId = yield waitForEventId();
        const sentryEvent = yield fetchEvent(eventId);
        expect(sentryEvent.eventID).toMatch(eventId);
    }));
    test('close', () => __awaiter(void 0, void 0, void 0, function* () {
        const element = yield getElement('close');
        yield element.click();
        // Wait a while in case it gets set.
        yield sleep(5000);
        // This time we don't expect an eventId.
        yield waitUntilEventIdIsEmpty();
    }));
});
