import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
// import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
// import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
// import {Store} from "n3";

type Callback = () => Promise<any>;
type StoredTest = {label: string, f: Callback};

const BeforeAllz: Callback[] = [];
const AfterAllz: Callback[] = [];
const BeforeEachz: Callback[] = [];
const AfterEachz: Callback[] = [];
const Tests: StoredTest[] = [];

let managerUrl: URL = null!;
let manager: ShapeTreeManager = null!;
let assignment1: ShapeTreeAssignment = null!;
let assignment2: ShapeTreeAssignment = null!;
let assignment3: ShapeTreeAssignment = null!;
let nonContainingAssignment1: ShapeTreeAssignment = null!;
let nonContainingAssignment2: ShapeTreeAssignment = null!;
let containingAssignment1: ShapeTreeAssignment = null!;
let httpExternalDocumentLoader: HttpExternalDocumentLoader = null!;

httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["shapetrees/manager-shapetree-ttl"], "GET", "/static/shapetrees/managers/shapetree", null)
]);

// beforeAll(async () => {
//   return await server.start(dispatcher);
// });
afterAll(async () => {
  return await server.stop();
});

beforeAll(async () => {
  await server.start(dispatcher);
  managerUrl = new URL("https://site.example/resource.shapetree");
  assignment1 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeOne"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln1"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeOne"), new URL("https://site.example/resource.shapetree#ln1"));
  assignment2 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeTwo"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln2"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeTwo"), new URL("https://site.example/resource.shapetree#ln2"));
  assignment3 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeThree"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln3"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeThree"), new URL("https://site.example/resource.shapetree#ln3"));
  nonContainingAssignment1 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#NonContainingTree"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln1"), null, null, server.urlFor("/data/container/.shapetree#ln1"));
  containingAssignment1 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#ContainingTree"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln2"), null, null, server.urlFor("/data/container/.shapetree#ln2"));
  nonContainingAssignment2 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#NonContainingTree2"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln3"), null, null, server.urlFor("/data/container/.shapetree#ln3"));
  await Promise.resolve();
});

beforeEach(async () => {
  manager = new ShapeTreeManager(managerUrl);
});



function beforeAll (f: Callback) {
  BeforeAllz.push(f);
}
function afterAll (f: Callback) { AfterAllz.push(f); }
function beforeEach (f: Callback) { BeforeEachz.push(f); }
function afterEach (f: Callback) { AfterEachz.push(f); }

function test (label: string, f: Callback) { Tests.push({label, f}); }

async function run () {
  await Promise.all(BeforeAllz.map(async (f) => await f()));
  await Promise.all(Tests.map(async (t) => {
    console.log(t.label);
    await Promise.all(BeforeEachz.map(async (f) => await f()));
    try {
      await t.f();
    } catch (ex: any) {
      console.warn("harness.ts saw exception: " + (ex.stack || ex.message));
    }
    await Promise.all(AfterEachz.map(async (f) => await f()));
  }));
  await Promise.all(AfterAllz.map(async (f) => await f()));
}

test("Get containing shape tree assignment from shape tree manager", async () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(containingAssignment1);
  const assignments = await manager.getContainingAssignments();
  console.log(assignments.length, 1);
  // console.log((await manager.getContainingAssignments()).indexOf(containingAssignment1) !== -1, true);
  // console.log((await manager.getContainingAssignments()).indexOf(nonContainingAssignment1) !== -1, false);
});

run();
