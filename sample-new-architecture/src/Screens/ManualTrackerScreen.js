var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as React from 'react';
import { Button, View, StyleSheet, Text, ActivityIndicator, } from 'react-native';
import * as Sentry from '@sentry/react-native';
/**
 * An example of how to add a Sentry Transaction to a React component manually.
 * So you can control all spans that belong to that one transaction.
 *
 * This screen calls an API to get the latest COVID-19 Data to display. We attach a span
 * to the fetch call and track the time it takes for Promise to resolve.
 */
const TrackerScreen = () => {
    const [cases, setCases] = React.useState(null);
    const loadData = () => __awaiter(void 0, void 0, void 0, function* () {
        setCases(null);
        yield Sentry.startSpan({
            name: 'Fetch Covid19 data from API',
            op: 'http',
        }, (span) => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield fetch('https://api.covid19api.com/summary', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const json = yield Sentry.startSpan({ name: 'Parse JSON' }, () => response.json());
            setCases(json.Global);
            span === null || span === void 0 ? void 0 : span.setData('json', json);
        }));
    });
    React.useEffect(() => {
        var _a;
        (_a = Sentry.getActiveSpan()) === null || _a === void 0 ? void 0 : _a.finish();
        Sentry.startSpan({
            name: 'Manual Tracker',
            op: 'navigation',
        }, loadData);
    }, []);
    return (<View style={styles.screen}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Global COVID19 Cases</Text>
      </View>
      <View style={styles.card}>
        {cases ? (<>
            <Statistic title="Confirmed" count={cases.TotalConfirmed} textColor="#C83852"/>
            <Statistic title="Deaths" count={cases.TotalDeaths} textColor="#362D59"/>
            <Statistic title="Recovered" count={cases.TotalRecovered} textColor="#69C289"/>
          </>) : (<ActivityIndicator size="small" color="#F6F6F8"/>)}
      </View>
      <Button title="Refresh" onPress={loadData}/>
    </View>);
};
export default Sentry.withProfiler(TrackerScreen);
const Statistic = (props) => {
    return (<View style={styles.statisticContainer}>
      <Text>{props.title}</Text>
      <Text style={[styles.statisticCount, { color: props.textColor }]}>
        {`${props.count}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}
      </Text>
    </View>);
};
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
        paddingBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    card: {
        width: '100%',
        height: 240,
        padding: 12,
        borderWidth: 1,
        borderColor: '#79628C',
        borderRadius: 6,
        backgroundColor: '#F6F6F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statisticContainer: {
        width: '100%',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statisticTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    statisticCount: {
        fontSize: 16,
        fontWeight: '700',
    },
});
