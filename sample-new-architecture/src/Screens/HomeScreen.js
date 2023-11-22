var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect } from 'react';
import { StatusBar, ScrollView, Text, Button as NativeButton, View, StyleSheet, NativeModules, Platform, } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { setScopeProperties } from '../setScopeProperties';
import { CommonActions } from '@react-navigation/native';
import { UserFeedbackModal } from '../components/UserFeedbackModal';
import NativeSampleModule from '../../tm/NativeSampleModule';
const { AssetsModule, CppModule } = NativeModules;
const HomeScreen = (props) => {
    // Show bad code inside error boundary to trigger it.
    const [showBadCode, setShowBadCode] = React.useState(false);
    const [isFeedbackVisible, setFeedbackVisible] = React.useState(false);
    const onPressPerformanceTiming = () => {
        // Navigate with a reset action just to test
        props.navigation.dispatch(CommonActions.reset({
            index: 1,
            routes: [
                { name: 'Home' },
                {
                    name: 'PerformanceTiming',
                    params: { someParam: 'hello' },
                },
            ],
        }));
    };
    const errorBoundaryFallback = ({ eventId }) => (<Text>Error boundary caught with event id: {eventId}</Text>);
    const [data, setData] = React.useState(null);
    useEffect(() => {
        AssetsModule.getExampleAssetData().then((asset) => setData(new Uint8Array(asset)));
    }, []);
    return (<>
      <StatusBar barStyle="dark-content"/>
      <ScrollView style={styles.mainView}>
        <Text style={styles.welcomeTitle}>Hey there!</Text>
        <Button title="Capture message" onPress={() => {
            Sentry.captureMessage('Captured message');
        }}/>
        <Button title="Capture exception" onPress={() => {
            Sentry.captureException(new Error('Captured exception'));
        }}/>
        <Button title="Uncaught Thrown Error" onPress={() => {
            throw new Error('Uncaught Thrown Error');
        }}/>
        <Button title="Unhandled Promise Rejection" onPress={() => {
            Promise.reject('Unhandled Promise Rejection');
        }}/>
        <Button title="Native Crash" onPress={() => {
            Sentry.nativeCrash();
        }}/>
        <Button title="Set Scope Properties" onPress={() => {
            setScopeProperties();
        }}/>
        <Button title="Flush" onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            yield Sentry.flush();
            console.log('Sentry.flush() completed.');
        })}/>
        <Button title="Close" onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            yield Sentry.close();
            console.log('Sentry.close() completed.');
        })}/>
        <Button title="Crash in Cpp" onPress={() => {
            NativeSampleModule === null || NativeSampleModule === void 0 ? void 0 : NativeSampleModule.crash();
        }}/>
        {Platform.OS === 'android' && (<Button title="Crash in Android Cpp" onPress={() => {
                CppModule === null || CppModule === void 0 ? void 0 : CppModule.crashCpp();
            }}/>)}
        <Spacer />
        <Sentry.ErrorBoundary fallback={errorBoundaryFallback}>
          <Button title="Activate Error Boundary" onPress={() => {
            setShowBadCode(true);
        }}/>
          {showBadCode && <div />}
        </Sentry.ErrorBoundary>

        <Spacer />

        <Button title="Add attachment" onPress={() => {
            Sentry.configureScope(scope => {
                scope.addAttachment({
                    data: 'Attachment content',
                    filename: 'attachment.txt',
                    contentType: 'text/plain',
                });
                if (data) {
                    scope.addAttachment({
                        data,
                        filename: 'logo.png',
                        contentType: 'image/png',
                    });
                }
                console.log('Sentry attachment added.');
            });
        }}/>
        <Button title="Get attachments" onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            Sentry.configureScope(scope => {
                console.log('Attachments:', scope.getAttachments());
            });
        })}/>
        <Button title="Capture HTTP Client Error" onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                fetch('http://localhost:8081/not-found');
            }
            catch (error) {
                //ignore the error, it will be send to Sentry automatically
            }
        })}/>
        <Button title="Auto Tracing Example" onPress={() => {
            props.navigation.navigate('Tracker');
        }}/>
        <Button title="Manual Tracing Example" onPress={() => {
            props.navigation.navigate('ManualTracker');
        }}/>
        <Button title="Gestures Tracing Example" onPress={() => {
            props.navigation.navigate('Gestures');
        }}/>
        <Button title="Performance Timing" onPress={onPressPerformanceTiming}/>
        <Button title="Redux Example" onPress={() => {
            props.navigation.navigate('Redux');
        }}/>
        <Button title="Send user feedback" onPress={() => {
            setFeedbackVisible(true);
        }}/>
        {isFeedbackVisible ? (<UserFeedbackModal onDismiss={() => {
                setFeedbackVisible(false);
            }}/>) : null}
        <View style={styles.mainViewBottomWhiteSpace}/>
      </ScrollView>
    </>);
};
const Button = (props) => (<>
    <NativeButton {...props} color="#6C5FC7"/>
    <View style={styles.buttonSpacer}/>
  </>);
const Spacer = () => <View style={styles.spacer}/>;
const styles = StyleSheet.create({
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#362D59',
        marginBottom: 20,
    },
    buttonSpacer: {
        marginBottom: 8,
    },
    spacer: {
        height: 1,
        width: '100%',
        backgroundColor: '#c6becf',
        marginBottom: 16,
        marginTop: 8,
    },
    mainView: {
        padding: 20,
    },
    mainViewBottomWhiteSpace: {
        marginTop: 32,
    },
});
export default HomeScreen;
