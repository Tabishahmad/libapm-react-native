import { createStore } from 'redux';
import * as Sentry from '@sentry/react';
const initialState = {
    counter: 0,
};
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'COUNTER_INCREMENT':
            return Object.assign(Object.assign({}, state), { counter: state.counter + 1 });
        case 'COUNTER_RESET':
            return Object.assign(Object.assign({}, state), { counter: 0 });
        default:
            return state;
    }
};
/*
  Example of how to use the Sentry redux enhancer packaged with @sentry/react:
*/
const sentryEnhancer = Sentry.createReduxEnhancer();
const store = createStore(reducer, sentryEnhancer);
export { store };
