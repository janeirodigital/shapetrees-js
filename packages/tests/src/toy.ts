import * as Fs from 'fs';
import * as Path from 'path';
import * as log from 'loglevel';
import * as Mockttp from 'mockttp';
/*
tried node-fetch but got:
    /home/eric/checkouts/janeirodigital/shapetrees-js/node_modules/node-fetch/src/index.js:9
    import http from 'node:http';
    ^^^^^^

    SyntaxError: Cannot use import statement outside a module

   > 5 | import fetch from 'node-fetch';
       | ^
 */
import fetch from 'cross-fetch';
import * as Yaml from 'js-yaml';

log.setLevel("info");
const mockServer = Mockttp.getLocal({ debug: false });

beforeEach(() => mockServer.start(8080));
afterEach(() => mockServer.stop());
beforeAll(() => console.log(`    * tests run at ${new Date()}`));

function sum(a: number, b: number) {
    return a + b;
}

class Test {
    constructor(
        public name: string,
        public p1: number,
        public p2: number,
    ) {}
    add(): number { return this.p1 + this.p2; }
};
class TestList {
    constructor(
        public name: string,
        public tests: Test[],
    ) {}
}

const yamlText = Fs.readFileSync(Path.join(__dirname, '../fixtures/toy.yaml'), 'utf8');
const MySuite = Yaml.load(yamlText) as TestList;

Object.setPrototypeOf(MySuite, TestList.prototype);
MySuite.tests.forEach(t => {
    Object.setPrototypeOf(t, Test.prototype);
})

test('adds 1 + 2 to equal 3', () => {
    const test = MySuite.tests.find(t => t.name === 't123');
    if (!test) throw new Error();
    expect(sum(test.p1, test.p2)).toBe(test.add());
});

describe(MySuite.name, () => {
    test.each(MySuite.tests)(
        "%s",
        (t) => {
            const result = sum(t.p1, t.p2);
            expect(result).toEqual(t.add());
        }
    );
});

const data = '/ldp/data/';
test('test test infrastructure', async () => {
    const b2 = `document at ${data}`;
    await mockServer.get(data).thenReply(200, b2, {
        'Content-type': 'text/plain',
        'Cookie-set': [ // test repeated cookies per https://tools.ietf.org/html/rfc7230#section-3.2.2
            'language=pl; expires=Sat, 15-Jul-2017 23:58:22 GMT; path=/; domain=x.com',
            'id=123 expires=Sat, 15-Jul-2017 23:58:22 GMT; path=/; domain=x.com; httponly'
        ]
    });
    const resp = await fetch(mockServer.urlFor(data));
    expect(await resp.text()).toEqual(b2);
});
