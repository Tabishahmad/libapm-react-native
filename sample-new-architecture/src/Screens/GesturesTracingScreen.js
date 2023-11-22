import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getCurrentHub, sentryTraceGesture } from '@sentry/react-native';
const GesturesTracingScreen = () => {
    const gesture = Gesture.Pinch().onBegin(() => {
        startExampleSpan();
    });
    return (<GestureDetector gesture={sentryTraceGesture('pinch', gesture)}>
      <View style={styles.screen}>
        <Text>Do pinch gesture</Text>
      </View>
    </GestureDetector>);
};
const startExampleSpan = () => {
    getCurrentHub().withScope((scope) => {
        var _a;
        const child = (_a = scope.getTransaction()) === null || _a === void 0 ? void 0 : _a.startChild({ op: 'example' });
        setTimeout(() => {
            child === null || child === void 0 ? void 0 : child.finish();
        }, 1000);
    });
};
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
export default GesturesTracingScreen;
