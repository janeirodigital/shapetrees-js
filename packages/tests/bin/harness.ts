import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
// import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
// import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { HttpShapeTreeClient } from '@shapetrees/client-http/src/HttpShapeTreeClient';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import * as log from "loglevel";
log.setLevel("info");
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

// beforeAll(async () => {
//   return await server.start(dispatcher);
// });
afterAll(async () => {
  return await server.stop();
});

beforeAll(async () => {
  await server.start(dispatcher);
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
  let targetResource: URL = server.urlFor("/data/projects/");
  let targetShapeTree: URL = server.urlFor("/static/shapetrees/project/shapetree#ProjectCollectionTree");
  // Plant the projects collection recursively on already existing hierarchy
  let response: DocumentResponse = await shapeTreeClient.plantShapeTree(context, targetResource, targetShapeTree, null!);
  expect(201).toEqual(response.getStatusCode());
});

run();
