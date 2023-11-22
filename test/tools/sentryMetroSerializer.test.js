var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from 'fs';
import CountingSet from 'metro/src/lib/CountingSet';
import * as countLines from 'metro/src/lib/countLines';
import { minify } from 'uglify-js';
import { createSentryMetroSerializer } from '../../src/js/tools/sentryMetroSerializer';
import { createDebugIdSnippet } from '../../src/js/tools/utils';
describe('Sentry Metro Serializer', () => {
    test('debug id minified code snippet is the same as in the original implementation', () => {
        const original = fs.readFileSync(`${__dirname}/../../scripts/sentry-debugid-injection-snippet.js`, 'utf8');
        const minified = minify(original).code;
        const snippet = createDebugIdSnippet('__SENTRY_DEBUG_ID__');
        expect(minified).toEqual(snippet);
    });
    test('generates bundle and source map with deterministic uuidv5 debug id', () => __awaiter(void 0, void 0, void 0, function* () {
        const serializer = createSentryMetroSerializer();
        const bundle = yield serializer(...mockMinSerializerArgs());
        if (typeof bundle === 'string') {
            fail('Expected bundle to be an object with a "code" property');
        }
        expect(bundle.code).toEqual('var _sentryDebugIds={},_sentryDebugIdIdentifier="";void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="901c00b1-71e1-40fc-b787-3fe0a7e23a92",_sentryDebugIdIdentifier="sentry-dbid-901c00b1-71e1-40fc-b787-3fe0a7e23a92")}catch(e){}\n//# debugId=901c00b1-71e1-40fc-b787-3fe0a7e23a92');
        expect(bundle.map).toEqual('{"version":3,"sources":["__debugid__"],"sourcesContent":["var _sentryDebugIds={},_sentryDebugIdIdentifier=\\"\\";void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]=\\"901c00b1-71e1-40fc-b787-3fe0a7e23a92\\",_sentryDebugIdIdentifier=\\"sentry-dbid-901c00b1-71e1-40fc-b787-3fe0a7e23a92\\")}catch(e){}"],"names":[],"mappings":"","debug_id":"901c00b1-71e1-40fc-b787-3fe0a7e23a92","debugId":"901c00b1-71e1-40fc-b787-3fe0a7e23a92"}');
    }));
    test('generated debug id is uuid v4 format', () => __awaiter(void 0, void 0, void 0, function* () {
        const serializer = createSentryMetroSerializer();
        const bundle = yield serializer(...mockMinSerializerArgs());
        const debugId = determineDebugIdFromBundleSource(typeof bundle === 'string' ? bundle : bundle.code);
        expect(debugId).toEqual('901c00b1-71e1-40fc-b787-3fe0a7e23a92');
    }));
    test('adds debug id snipped after prelude module and before ', () => __awaiter(void 0, void 0, void 0, function* () {
        const serializer = createSentryMetroSerializer();
        const bundle = yield serializer(...mockWithPreludeAndDepsSerializerArgs());
        if (typeof bundle === 'string') {
            fail('Expected bundle to be an object with a "code" property');
        }
        expect(bundle.code).toEqual(fs.readFileSync(`${__dirname}/fixtures/bundleWithPrelude.js.fixture`, 'utf8'));
        expect(bundle.map).toEqual(fs.readFileSync(`${__dirname}/fixtures/bundleWithPrelude.js.fixture.map`, 'utf8'));
    }));
});
function mockMinSerializerArgs() {
    let modulesCounter = 0;
    return [
        'index.js',
        [],
        {
            entryPoints: new Set(),
            dependencies: new Map(),
            transformOptions: {
                hot: false,
                dev: false,
                minify: false,
                type: 'script',
                unstable_transformProfile: 'hermes-stable',
            },
        },
        {
            asyncRequireModulePath: 'asyncRequire',
            createModuleId: (_filePath) => modulesCounter++,
            dev: false,
            getRunModuleStatement: (_moduleId) => '',
            includeAsyncPaths: false,
            modulesOnly: false,
            processModuleFilter: (_module) => true,
            projectRoot: '/project/root',
            runBeforeMainModule: [],
            runModule: false,
            serverRoot: '/server/root',
            shouldAddToIgnoreList: (_module) => false,
        },
    ];
}
function mockWithPreludeAndDepsSerializerArgs() {
    const mockPreludeCode = '__mock_prelude__';
    const indexJsCode = '__mock_index_js__';
    const args = mockMinSerializerArgs();
    args[1] = [
        {
            dependencies: new Map(),
            getSource: () => Buffer.from(mockPreludeCode),
            inverseDependencies: new CountingSet(),
            path: '__prelude__',
            output: [
                {
                    type: 'js/script/virtual',
                    data: {
                        code: mockPreludeCode,
                        lineCount: countLines(indexJsCode),
                        map: [],
                    },
                },
            ],
        },
    ];
    // @ts-expect-error - This is a mock
    args[2].dependencies = new Map([
        [
            'index.js',
            {
                dependencies: new Map(),
                getSource: () => Buffer.from(indexJsCode),
                inverseDependencies: new CountingSet(),
                path: 'index.js',
                output: [
                    {
                        type: 'js/script/virtual',
                        data: {
                            code: indexJsCode,
                            lineCount: countLines(indexJsCode),
                            map: [],
                        },
                    },
                ],
            },
        ],
    ]);
    return args;
}
/**
 * This function is on purpose not shared with the actual implementation.
 */
function determineDebugIdFromBundleSource(code) {
    const match = code.match(/sentry-dbid-([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/);
    return match === null || match === void 0 ? void 0 : match[1];
}
