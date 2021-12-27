import {DispatcherEntry} from "../src/fixtures/DispatcherEntry";
import {RequestMatchingFixtureDispatcher} from "../src/fixtures/RequestMatchingFixtureDispatcher";
import {DispatchEntryServer} from "../src/fixtures/DispatchEntryServer";
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
import * as log from 'loglevel';

log.setLevel("info");

const MockServer = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["http/404", "discover/managed"], "GET",  "/path/1", null),
    new DispatcherEntry(["http/201"                    ], "POST", "/path/1", null),
]);
beforeAll(() => { return MockServer.start(dispatcher); });
afterAll(() => { return MockServer.stop(); });

test('GET path/1 -> 404', async () => {
    const path = '/path/1';
    const req = new Request(MockServer.urlFor(path).href, {
        method: 'GET',
        headers: {link: 'link1, link2'}
    })
    const resp1 = await fetch(req);
    expect(await resp1.text()).toEqual(`404 Not expected to be found\n`);
});

test('POST path/1 -> 201', async () => {
    const path = '/path/1';
    const req = new Request(MockServer.urlFor(path).href, {
        method: 'POST',
        headers: {link: 'link1, link2'},
        body: '  <#a> <#b> <#c> .\n'
    })
    const resp1 = await fetch(req);
    expect(await resp1.text()).toEqual(`201 Created content\n`);
});

test('GET path/1 -> 200', async () => {
    const path = '/path/1';
    const req = new Request(MockServer.urlFor(path).href, {
        method: 'GET',
        headers: {link: 'link1, link2'}
    })
    const resp1 = await fetch(req);
    expect(await resp1.text()).toEqual(`<#a> <#b> <#c> .\n`);
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
