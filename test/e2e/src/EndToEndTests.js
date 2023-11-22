var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable import/no-unresolved, @typescript-eslint/no-unsafe-member-access */
import * as Sentry from '@sentry/react-native';
import * as React from 'react';
import { Text, View } from 'react-native';
import { getTestProps } from './utils/getTestProps';
export { getTestProps };
/**
 * This screen is for internal end-to-end testing purposes only. Do not use.
 * Not visible through the UI (no button to load it).
 */
// Deprecated in https://github.com/DefinitelyTyped/DefinitelyTyped/commit/f1b25591890978a92c610ce575ea2ba2bbde6a89
// eslint-disable-next-line deprecation/deprecation
const EndToEndTestsScreen = () => {
    const [eventId, setEventId] = React.useState();
    // !!! WARNING: This is only for testing purposes.
    // We only do this to render the eventId onto the UI for end to end tests.
    React.useEffect(() => {
        const client = Sentry.getCurrentHub().getClient();
        client.getOptions().beforeSend = (e) => {
            setEventId(e.event_id || null);
            return e;
        };
    }, []);
    return (<View>
      <Text {...getTestProps('eventId')}>{eventId}</Text>
      <Text {...getTestProps('clearEventId')} onPress={() => setEventId('')}>
        Clear Event Id
      </Text>
      <Text {...getTestProps('captureMessage')} onPress={() => {
            Sentry.captureMessage('React Native Test Message');
        }}>
        captureMessage
      </Text>
      <Text {...getTestProps('captureException')} onPress={() => {
            Sentry.captureException(new Error('captureException test'));
        }}>
        captureException
      </Text>
      <Text onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            yield Promise.reject(new Error('Unhandled Promise Rejection'));
        })} {...getTestProps('unhandledPromiseRejection')}>
        Unhandled Promise Rejection
      </Text>
      <Text {...getTestProps('close')} onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            yield Sentry.close();
        })}>
        close
      </Text>
    </View>);
};
export default EndToEndTestsScreen;
