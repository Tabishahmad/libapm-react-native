export const createMockedRoutingInstrumentation = () => {
    const mock = {
        name: 'TestRoutingInstrumentationInstance',
        onRouteWillChange: jest.fn(),
        registerRoutingInstrumentation: jest.fn((listener, beforeNavigate, onConfirmRoute) => {
            mock.registeredListener = listener;
            mock.registeredBeforeNavigate = beforeNavigate;
            mock.registeredOnConfirmRoute = onConfirmRoute;
        }),
    };
    return mock;
};
export const mockedConfirmedRouteTransactionContext = {
    name: 'mockedRouteName',
    data: {
        route: {
            name: 'mockedRouteName',
        },
    },
};
