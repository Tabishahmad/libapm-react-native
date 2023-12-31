import * as React from 'react';
import { wrap } from '../src/js/sdk';
describe('Sentry.wrap', () => {
    it('should not enforce any keys on the wrapped component', () => {
        const Mock = () => <></>;
        const ActualWrapped = wrap(Mock);
        expect(typeof ActualWrapped.defaultProps).toBe(typeof Mock.defaultProps);
    });
});
