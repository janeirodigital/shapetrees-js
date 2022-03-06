import {DispatcherEntry} from "../src/fixtures/DispatcherEntry";
import {RequestMatchingFixtureDispatcher} from "../src/fixtures/RequestMatchingFixtureDispatcher";
import {DispatchEntryServer} from "../src/fixtures/DispatchEntryServer";
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { HttpShapeTreeClient } from '@shapetrees/client-http/src/HttpShapeTreeClient';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
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
const context = new ShapeTreeContext(null);
const shapeTreeClient: HttpShapeTreeClient = new HttpShapeTreeClient();

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["project/data-container"], "GET", "/data/", null),
    new DispatcherEntry(["project/projects-container"], "GET", "/data/projects/", null),
    new DispatcherEntry(["project/project-1-container"], "GET", "/data/projects/project-1/", null),
    new DispatcherEntry(["project/milestone-3-container"], "GET", "/data/projects/project-1/milestone-3/", null),
    new DispatcherEntry(["project/task-48-container"], "GET", "/data/projects/project-1/milestone-3/task-48/", null),
    new DispatcherEntry(["project/task-6-container-no-contains"], "GET", "/data/projects/project-1/milestone-3/task-6/", null),
    new DispatcherEntry(["project/issue-2"], "GET", "/data/projects/project-1/milestone-3/issue-2", null),
    new DispatcherEntry(["project/issue-3"], "GET", "/data/projects/project-1/milestone-3/issue-3", null),
    new DispatcherEntry(["project/attachment-48"], "GET", "/data/projects/project-1/milestone-3/task-48/attachment-48", null),
    new DispatcherEntry(["project/random-png"], "GET", "/data/projects/project-1/milestone-3/task-48/random.png", null),
    new DispatcherEntry(["shapetrees/project-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree", null),
    new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project/shex", null),
    // new DispatcherEntry(["http/201"], "POST", "/data/.shapetree", null),
    // new DispatcherEntry(["http/201"], "POST", "/data/projects/.shapetree", null),
    new DispatcherEntry(["project/data-container-manager"], "GET", "/data/.shapetree", null),
    new DispatcherEntry(["project/projects-container-manager"], "GET", "/data/projects/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/attachment-48.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/random.png.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-6/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-3.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-2.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/.shapetree", null),
]);
beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

test('GET path/1 -> 404', async () => {
    let targetResource: URL = server.urlFor("/data/projects/");
    let targetShapeTree: URL = server.urlFor("/static/shapetrees/project/shapetree#ProjectCollectionTree");
    // Plant the projects collection recursively on already existing hierarchy
    let response: DocumentResponse = await shapeTreeClient.plantShapeTree(context, targetResource, targetShapeTree, null!);
    expect(201).toEqual(response.getStatusCode());
});

/*
it("should test async errors",() => {
    await expect(async () => {
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
