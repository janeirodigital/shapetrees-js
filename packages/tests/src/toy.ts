import * as Fs from 'fs';
import * as Path from 'path';
import * as log from 'loglevel';
import {DispatcherEntry} from "./fixtures/DispatcherEntry";
import {RequestMatchingFixtureDispatcher} from "./fixtures/RequestMatchingFixtureDispatcher";
import {DispatchEntryServer} from "./fixtures/DispatchEntryServer";
import * as Yaml from 'js-yaml';
/*
tried node-fetch but got:
    /home/eric/checkouts/janeirodigital/shapetrees-js/node_modules/node-fetch/src/index.js:9
    import http from 'node:http';
    ^^^^^^

    SyntaxError: Cannot use import statement outside a module

   > 5 | import fetch from 'node-fetch';
       | ^
 */
import {fetch, Request} from 'cross-fetch';

log.setLevel("info");

const MockServer = new DispatchEntryServer();
const DispatcherEntries = [
    new DispatcherEntry(["discover/unmanaged"], "GET", "/unmanaged", null),
    new DispatcherEntry(["discover/unmanaged-manager"], "GET", "/unmanaged.shapetree", null),
    new DispatcherEntry(["discover/managed"], "GET", "/managed", null),
    new DispatcherEntry(["discover/managed-manager"], "GET", "/managed.shapetree", null),
    new DispatcherEntry(["discover/managed-invalid-1"], "GET", "/managed-invalid-1", null),
    new DispatcherEntry(["discover/managed-invalid-1-manager"], "GET", "/managed-invalid-1.shapetree", null),
    new DispatcherEntry(["discover/managed-invalid-2"], "GET", "/managed-invalid-2", null),
    new DispatcherEntry(["discover/managed-invalid-2-manager"], "GET", "/managed-invalid-2.shapetree", null),
    new DispatcherEntry(["discover/no-manager"], "GET", "/no-manager", null),
];
beforeAll(() => {return MockServer.start(new RequestMatchingFixtureDispatcher(DispatcherEntries));});
afterAll(() => { return MockServer.stop(); });

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

if (false)
test('adds 1 + 2 to equal 3', () => {
    const test = MySuite.tests.find(t => t.name === 't123');
    if (!test) throw new Error();
    expect(sum(test.p1, test.p2)).toBe(test.add());
});

if (false)
describe(MySuite.name, () => {
    test.each(MySuite.tests)(
        "%s",
        (t) => {
            const result = sum(t.p1, t.p2);
            expect(result).toEqual(t.add());
        }
    );
});

test('test test infrastructure', async () => {
    const path = '/path/1/';
    const req = new Request(MockServer.urlFor(path), {
        method: 'POST',
        headers: {link: 'link1, link2'},
        body: 'line 1\nline 2\nline 3\n'
    })
    const resp1 = await fetch(req);
    expect(await resp1.text()).toEqual(`POST ${path}`);
    const resp2 = await fetch(req);
    expect(await resp2.text()).toEqual(`POST ${path}`);
});

test('test test infrastructure2', async () => {
    const path = '/path/2/';
    const req = new Request(MockServer.urlFor(path), {
        method: 'POST',
        headers: {link: 'link1, link2'},
        body: 'line 1\nline 2\nline 3\n'
    })
    const resp1 = await fetch(req);
    expect(await resp1.text()).toEqual(`POST ${path}`);
    const resp2 = await fetch(req);
    expect(await resp2.text()).toEqual(`POST ${path}`);
});

/*
it("should test async errors",() => {
    expect(async () => {
        await asyncFunctionWithCustomError();
    }).rejects.toBeInstanceOf(MyError)

    await expect(async () => {
        await asyncFunctionWithCustomError();
    }).rejects.toEqual(new MyError(430, "it's b0rked"))

    try {
        await asyncFunctionWithCustomError();
    } catch (ex: any) {
        expect(ex).toEqual(new MyError(430, "it's b0rked"));
    }
})

class Orphan {
    constructor(public status: number, public message: string) {}
}

class Child extends Error {
    constructor(public status: number, message: string) {super(message);}
}

const o1a1 = new Orphan(1, "a");
const o1a2 = new Orphan(1, "a");
const o2a = new Orphan(2, "a");

const c1a1 = new Child(1, "a");
const c1a2 = new Child(1, "a");
const c2a = new Child(2, "a");

if (false) {
test("pass async Orphan equals Orphan", () => {expect(o1a1).toEqual(o1a2);})
test("fail async Orphan equals Orphan", () => {expect(o1a1).toEqual(o2a);})
test("pass async Child equals Child", () => {expect(c1a1).toEqual(c1a2);})
test("fail async Child equals Child", () => {expect(c1a1).toEqual(c2a);})
}

class MyError {
    // to dance around https://github.com/Microsoft/TypeScript/issues/13965
    constructor (
        private status: number,
        private message: string,
    ) {}
}

async function asyncFunctionWithCustomError () {
    await Promise.resolve(null);
    throw new MyError(430, "it's b0rked");
}
 */
