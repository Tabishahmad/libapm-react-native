import { ReactNativeScope } from '../src/js/scope';
import { NATIVE } from '../src/js/wrapper';
jest.mock('../src/js/wrapper');
const createScope = () => {
    return new ReactNativeScope();
};
describe('Scope', () => {
    describe('addBreadcrumb', () => {
        let scope;
        let nativeAddBreadcrumbMock;
        beforeEach(() => {
            scope = createScope();
            nativeAddBreadcrumbMock = NATIVE.addBreadcrumb.mockImplementationOnce(() => {
                return;
            });
        });
        afterEach(() => {
            jest.resetAllMocks();
        });
        it('adds default level if no level specified', () => {
            const breadcrumb = {
                message: 'test',
                timestamp: 1234,
            };
            scope.addBreadcrumb(breadcrumb);
            expect(scope._breadcrumbs).toEqual([
                {
                    message: 'test',
                    timestamp: 1234,
                    level: 'info',
                },
            ]);
        });
        it('adds timestamp to breadcrumb without timestamp', () => {
            const breadcrumb = {
                message: 'test',
            };
            scope.addBreadcrumb(breadcrumb);
            expect(scope._breadcrumbs).toEqual([expect.objectContaining({ timestamp: expect.any(Number) })]);
        });
        it('passes breadcrumb with timestamp to native', () => {
            const breadcrumb = {
                message: 'test',
            };
            scope.addBreadcrumb(breadcrumb);
            expect(nativeAddBreadcrumbMock).toBeCalledWith(expect.objectContaining({
                timestamp: expect.any(Number),
            }));
        });
        test('undefined breadcrumb data is not normalized when passing to the native layer', () => {
            const breadcrumb = {
                data: undefined,
            };
            scope.addBreadcrumb(breadcrumb);
            expect(nativeAddBreadcrumbMock).toBeCalledWith(expect.objectContaining({
                data: undefined,
            }));
        });
        test('object is normalized when passing to the native layer', () => {
            const breadcrumb = {
                data: {
                    foo: NaN,
                },
            };
            scope.addBreadcrumb(breadcrumb);
            expect(nativeAddBreadcrumbMock).toBeCalledWith(expect.objectContaining({
                data: { foo: '[NaN]' },
            }));
        });
        test('not object data is converted to object', () => {
            const breadcrumb = {
                data: 'foo',
            };
            scope.addBreadcrumb(breadcrumb);
            expect(nativeAddBreadcrumbMock).toBeCalledWith(expect.objectContaining({
                data: { value: 'foo' },
            }));
        });
    });
});
