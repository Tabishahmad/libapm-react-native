import { parseHermesJSStackFrame } from '../../src/js/profiling/convertHermesProfile';
describe('hermes', () => {
    describe('parseHermesStackFrameName', () => {
        test('parses function name and file name', () => {
            expect(parseHermesJSStackFrame({
                name: 'fooA(/absolute/path/main.jsbundle:1610:33)',
                line: '1610',
                column: '33',
                category: 'JavaScript',
            })).toEqual({
                function: 'fooA',
                abs_path: 'app:///main.jsbundle',
                lineno: 1610,
                colno: 33,
            });
        });
        test('parse hermes root stack frame', () => {
            expect(parseHermesJSStackFrame({
                name: '[root]',
                category: 'root',
            })).toEqual(expect.objectContaining({
                function: '[root]',
            }));
        });
        test('parse only file name', () => {
            expect(parseHermesJSStackFrame({
                name: '(/absolute/path/main.jsbundle:1610:33)',
                line: '1610',
                column: '33',
                category: 'JavaScript',
            })).toEqual({
                abs_path: 'app:///main.jsbundle',
                lineno: 1610,
                colno: 33,
            });
        });
        test('parse only function name', () => {
            expect(parseHermesJSStackFrame({
                name: 'fooA',
                category: 'JavaScript',
            })).toEqual(expect.objectContaining({
                function: 'fooA',
                abs_path: 'app:///main.jsbundle',
            }));
        });
    });
});
