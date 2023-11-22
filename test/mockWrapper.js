const NATIVE = {
    enableNative: true,
    nativeIsReady: true,
    platform: 'ios',
    _NativeClientError: new Error('MockNative client is not available'),
    _DisabledNativeError: new Error('MockNative is disabled'),
    _processItem: jest.fn(),
    _processLevels: jest.fn(),
    _processLevel: jest.fn(),
    _serializeObject: jest.fn(),
    _isModuleLoaded: jest.fn(),
    isNativeAvailable: jest.fn(),
    initNativeSdk: jest.fn(),
    closeNativeSdk: jest.fn(),
    sendEnvelope: jest.fn(),
    captureScreenshot: jest.fn(),
    fetchNativeRelease: jest.fn(),
    fetchNativeDeviceContexts: jest.fn(),
    fetchNativeAppStart: jest.fn(),
    fetchNativeFrames: jest.fn(),
    fetchNativeSdkInfo: jest.fn(),
    disableNativeFramesTracking: jest.fn(),
    enableNativeFramesTracking: jest.fn(),
    addBreadcrumb: jest.fn(),
    setContext: jest.fn(),
    clearBreadcrumbs: jest.fn(),
    setExtra: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    nativeCrash: jest.fn(),
    fetchModules: jest.fn(),
    fetchViewHierarchy: jest.fn(),
    startProfiling: jest.fn(),
    stopProfiling: jest.fn(),
    fetchNativePackageName: jest.fn(),
    fetchNativeStackFramesBy: jest.fn(),
};
NATIVE.isNativeAvailable.mockReturnValue(true);
NATIVE.initNativeSdk.mockResolvedValue(true);
NATIVE.captureScreenshot.mockResolvedValue(null);
NATIVE.fetchNativeRelease.mockResolvedValue({
    version: 'mock-native-version',
    build: 'mock-native-build',
    id: 'mock-native-id',
});
NATIVE.fetchNativeDeviceContexts.mockResolvedValue({});
NATIVE.fetchNativeAppStart.mockResolvedValue(null);
NATIVE.fetchNativeFrames.mockResolvedValue(null);
NATIVE.fetchNativeSdkInfo.mockResolvedValue(null);
NATIVE.fetchModules.mockResolvedValue(null);
NATIVE.fetchViewHierarchy.mockResolvedValue(null);
NATIVE.startProfiling.mockReturnValue(false);
NATIVE.stopProfiling.mockReturnValue(null);
NATIVE.fetchNativePackageName.mockResolvedValue('mock-native-package-name');
NATIVE.fetchNativeStackFramesBy.mockResolvedValue(null);
export { NATIVE };
