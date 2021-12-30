// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
import {Store} from "n3";

let managerUrl: URL = null!;
let manager: ShapeTreeManager = null!;
let assignment1: ShapeTreeAssignment = null!;
let assignment2: ShapeTreeAssignment = null!;
let assignment3: ShapeTreeAssignment = null!;
let nonContainingAssignment1: ShapeTreeAssignment = null!;
let nonContainingAssignment2: ShapeTreeAssignment = null!;
let containingAssignment1: ShapeTreeAssignment = null!;

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["shapetrees/manager-shapetree-ttl"], "GET", "/static/shapetrees/managers/shapetree", null)
]);
beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

beforeAll(() => {
  managerUrl = new URL("https://site.example/resource.shapetree");
  assignment1 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeOne"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln1"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeOne"), new URL("https://site.example/resource.shapetree#ln1"));
  assignment2 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeTwo"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln2"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeTwo"), new URL("https://site.example/resource.shapetree#ln2"));
  assignment3 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeThree"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln3"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeThree"), new URL("https://site.example/resource.shapetree#ln3"));
  nonContainingAssignment1 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#NonContainingTree"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln1"), null, null, server.urlFor("/data/container/.shapetree#ln1"));
  containingAssignment1 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#ContainingTree"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln2"), null, null, server.urlFor("/data/container/.shapetree#ln2"));
  nonContainingAssignment2 = new ShapeTreeAssignment(server.urlFor("/static/shapetrees/managers/shapetree#NonContainingTree2"), server.urlFor("/data/container/"), server.urlFor("/data/container/.shapetree#ln3"), null, null, server.urlFor("/data/container/.shapetree#ln3"));
});

beforeEach(() => {
  manager = new ShapeTreeManager(managerUrl);
});

// initializeShapeTreeManager
test("Initialize a new manager", () => {
  let newManager: ShapeTreeManager = new ShapeTreeManager(managerUrl);
  expect(newManager).not.toBeNull();
  expect(newManager.getId()).toEqual(managerUrl);
});

// addNewShapeTreeAssignmentToManager
test("Add a new assignment", () => {
  expect(manager.getAssignments().length === 0).toEqual(true);
  manager.addAssignment(assignment1);
  expect(manager.getAssignments().length === 0).toEqual(false);
  expect(manager.getAssignments().length).toEqual(1);
});

// failToAddNullAssignmentToManager
test("Fail to add a null assignment", async () => {
  await expect(async () => {
    await manager.addAssignment(null);
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToAddDuplicateAssignment
test("Fail to add a duplicate assignment", async () => {
  manager.addAssignment(assignment1);
  await expect(async () => {
    await manager.addAssignment(assignment1);
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// TODO: test null checks prevented by typescript?
// failToAddAssignmentWithBadValues
test("Fail to add assignment with certain null values", () => {
  expect(() => {
    new ShapeTreeAssignment(
      null!,
      new URL("https://site.example/resource"),
      null!,
      new URL("https://site.example/resource#node"),
      new URL("https://shapes.example/schema#ShapeThree"),
      new URL("https://site.example/resource.shapetree#ln3")
    );
  }).toThrow(/Failed to initialize shape tree assignment/);
  expect(() => {
    // focus node with no shape
    new ShapeTreeAssignment(
      new URL("https://tree.example/tree#TreeThree"),
      new URL("https://site.example/resource"),
      new URL("https://site.example/resource.shapetree#ln3"),
      new URL("https://site.example/resource#node"),
      null,
      new URL("https://site.example/resource.shapetree#ln3")
    );
  }).toThrow(/Failed to initialize shape tree assignment/);
  expect(() => {
    // shape with no focus node
    new ShapeTreeAssignment(
      new URL("https://tree.example/tree#TreeThree"),
      new URL("https://site.example/resource"),
      new URL("https://site.example/resource.shapetree#ln3"),
      null,
      new URL("https://shapes.example/schema#ShapeThree"),
      new URL("https://site.example/resource.shapetree#ln3")
    );
  }).toThrow(/Failed to initialize shape tree assignment/);
});

// failToMintDuplicateAssignment
test("Fail to mint the same assignment twice", () => {
  manager.addAssignment(assignment1);
  let adjustedUrl: URL = manager.mintAssignmentUrl(assignment1.getUrl());
  expect(assignment1.getUrl()).not.toEqual(adjustedUrl);
});

// getContainingShapeTreeAssignmentsFromManager
test("Get containing shape tree assignment from shape tree manager", async () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(containingAssignment1);
  expect(1).toEqual((await manager.getContainingAssignments()).length);
  expect((await manager.getContainingAssignments()).indexOf(containingAssignment1) !== -1).toEqual(true);
  expect((await manager.getContainingAssignments()).indexOf(nonContainingAssignment1) !== -1).toEqual(false);
});

// getNoContainingShapeTreeAssignmentFromManager
test("Get no containing shape tree assignment for shape tree manager", async () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(nonContainingAssignment2);
  expect((await manager.getContainingAssignments()).length === 0).toEqual(true);
});

// getNoShapeTreeAssignmentsFromEmptyManager
test("Get no shape tree assignment for shape tree from manager with no assignments", () => {
  expect(manager.getAssignmentForShapeTree(new URL("https://tree.example/shapetree#ExampleTree"))).toBeNull();
});

// getShapeTreeAssignmentFromManagerForShapeTree
test("Get shape tree assignment from manager for shape tree", () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(nonContainingAssignment2);
  manager.addAssignment(containingAssignment1);
  expect(containingAssignment1).toEqual(manager.getAssignmentForShapeTree(containingAssignment1.getShapeTree()));
});

// getNoShapeTreeAssignmentForShapeTree
test("Get no shape tree assignment from manager without matching shape tree", () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(nonContainingAssignment2);
  manager.addAssignment(containingAssignment1);
  expect(manager.getAssignmentForShapeTree(new URL("https://tree.example/shapetree#ExampleTree"))).toBeNull();
});

// failToRemoveAssignmentFromEmptyManager
test("Fail to remove assignment from empty manager", async () => {
  await expect(async () => {
    await manager.removeAssignment(containingAssignment1);
  }).rejects.toBeInstanceOf(Error);
});

// failToRemoveAssignmentMissingFromManager
test("Fail to remove assignment from empty manager", async () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(nonContainingAssignment2);
  await expect(async () => {
    await manager.removeAssignment(containingAssignment1);
  }).rejects.toBeInstanceOf(Error);
});

// removeAssignmentFromManager
test("Remove assignment from manager", () => {
  manager.addAssignment(nonContainingAssignment1);
  manager.addAssignment(nonContainingAssignment2);
  manager.addAssignment(containingAssignment1);
  expect(manager.getAssignmentForShapeTree(containingAssignment1.getShapeTree())).toEqual(containingAssignment1);
  manager.removeAssignment(containingAssignment1);
  expect(manager.getAssignmentForShapeTree(containingAssignment1.getShapeTree())).toBeNull();
});

// getAssignmentFromGraph
test("Get valid assignment from graph", async () => {
  let managerUri: URL = new URL("https://data.example/container.shapetree");
  let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, getValidManagerString(), "text/turtle");
  let manager: ShapeTreeManager = ShapeTreeManager.getFromGraph(managerUri, managerGraph);
  expect(manager).not.toBeNull();
  expect(manager.getAssignmentForShapeTree(new URL("https://tree.example/#Tree1"))).not.toBeNull();
});

// failToGetAssignmentFromGraphMissingTriples
test("Fail to get assignment from graph due to missing triples", async () => {
  let managerUri: URL = new URL("https://data.example/container.shapetree");
  let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, getInvalidManagerMissingTriplesString(), "text/turtle");
  expect(() => {
    ShapeTreeManager.getFromGraph(managerUrl, managerGraph);
  }).toThrow(/Incomplete shape tree assignment/);
  // .rejects.toBeInstanceOf(Error);
});

// failToGetAssignmentFromGraphUnexpectedValues
test("Fail to get assignment from graph due to unexpected values", async () => {
  let managerUri: URL = new URL("https://data.example/container.shapetree");
  let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, getInvalidManagerUnexpectedTriplesString(), "text/turtle");
  await expect(async () => {
    await ShapeTreeManager.getFromGraph(managerUrl, managerGraph);
  }).rejects.toBeInstanceOf(Error);
});


/*
it('should throw if the full header value is not passed in', async () => {
  await expect(
      instance.isValid(`X-No-Auth ${tokens.COMPLETE}`)
  ).to.be.rejectedWith(/or invalid/);
});
*/

function getValidManagerString(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "\n" +
    "\n" +
    "<https://data.example/container.shapetree> \n" +
    "    a st:Manager ; \n" +
    "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" +
    "\n" +
    "<https://data.example/container.shapetree#ln1> \n" +
    "    st:assigns <https://tree.example/#Tree1> ; \n" +
    "    st:hasRootAssignment <https://data.example/container.shapetree#ln1> ; \n" +
    "    st:manages <https://data.example/container> ; \n" +
    "    st:shape <https://shapes.example/#Shape1> ; \n" +
    "    st:focusNode <https://data.example/container#node> . \n" +
    "\n";
}

function getInvalidManagerMissingTriplesString(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "\n" +
    "\n" +
    "<https://data.example/container.shapetree> \n" +
    "    a st:Manager ; \n" +
    "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" +
    "\n" +
    "<https://data.example/container.shapetree#ln1> \n" +
    "    st:assigns <https://tree.example/#Tree1> ; \n" +
    "\n.";
}

function getInvalidManagerUnexpectedTriplesString(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "\n" +
    "\n" +
    "<https://data.example/container.shapetree> \n" +
    "    a st:Manager ; \n" +
    "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" +
    "\n" +
    "<https://data.example/container.shapetree#ln1> \n" +
    "    st:assigns <https://tree.example/#Tree1> ; \n" +
    "    st:hasRootAssignment <https://data.example/container.shapetree#ln1> ; \n" +
    "    st:manages <https://data.example/container> ; \n" +
    "    st:shape <https://shapes.example/#Shape1> ; \n" +
    "    st:focusNode <https://data.example/container#node> ; \n" +
    "    st:unexpected \"why am i here\" . \n" +
    "\n";
}
