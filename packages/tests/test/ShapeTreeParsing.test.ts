// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeFactory } from '@shapetrees/core/src/ShapeTreeFactory';
import { ShapeTreeResource } from '@shapetrees/core/src/ShapeTreeResource';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { RecursionMethods } from '@shapetrees/core/src/enums/RecursionMethods';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTree } from '@shapetrees/core/src/ShapeTree';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["shapetrees/project-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree", null),
    new DispatcherEntry(["shapetrees/business-shapetree-ttl"], "GET", "/static/shapetrees/business/shapetree", null),
    new DispatcherEntry(["shapetrees/reserved-type-shapetree-ttl"], "GET", "/static/shapetrees/reserved/shapetree", null),
    new DispatcherEntry(["shapetrees/project-shapetree-virtual-ttl"], "GET", "/static/shapetrees/project/shapetree-virtual", null),
    new DispatcherEntry(["shapetrees/project-shapetree-invalid-ttl"], "GET", "/static/shapetrees/project/shapetree-invalid", null),
    new DispatcherEntry(["shapetrees/project-shapetree-invalid-2-ttl"], "GET", "/static/shapetrees/project/shapetree-invalid2", null),
    new DispatcherEntry(["shapetrees/content-type-invalid-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree-bad-content-type", null),
    new DispatcherEntry(["shapetrees/missing-expects-type-shapetree-ttl"], "GET", "/static/shapetrees/invalid/missing-expects-type", null),
    new DispatcherEntry(["shapetrees/contains-with-bad-expects-type-shapetree-ttl"], "GET", "/static/shapetrees/invalid/contains-with-bad-expects-type", null),
    new DispatcherEntry(["shapetrees/bad-object-type-shapetree-ttl"], "GET", "/static/shapetrees/invalid/bad-object-type", null),
    new DispatcherEntry(["shapetrees/invalid-contains-objects-shapetree-ttl"], "GET", "/static/shapetrees/invalid/shapetree-invalid-contains-objects", null),
    new DispatcherEntry(["shapetrees/contains-with-nonrdf-expects-type-shapetree-ttl"], "GET", "/static/shapetrees/invalid/contains-with-nonrdf-expects-type", null),
    new DispatcherEntry(["parsing/contains/contains-1-ttl"], "GET", "/static/shapetrees/parsing/contains-1", null),
    new DispatcherEntry(["parsing/contains/contains-2-ttl"], "GET", "/static/shapetrees/parsing/contains-2", null),
    new DispatcherEntry(["parsing/contains/contains-2A-ttl"], "GET", "/static/shapetrees/parsing/contains-2A", null),
    new DispatcherEntry(["parsing/contains/contains-2B-ttl"], "GET", "/static/shapetrees/parsing/contains-2B", null),
    new DispatcherEntry(["parsing/contains/contains-2C-ttl"], "GET", "/static/shapetrees/parsing/contains-2C", null),
    new DispatcherEntry(["parsing/contains/contains-2C2-ttl"], "GET", "/static/shapetrees/parsing/contains-2C2", null),
    new DispatcherEntry(["parsing/references/references-1-ttl"], "GET", "/static/shapetrees/parsing/references-1", null),
    new DispatcherEntry(["parsing/references/references-2-ttl"], "GET", "/static/shapetrees/parsing/references-2", null),
    new DispatcherEntry(["parsing/references/references-2A-ttl"], "GET", "/static/shapetrees/parsing/references-2A", null),
    new DispatcherEntry(["parsing/references/references-2B-ttl"], "GET", "/static/shapetrees/parsing/references-2B", null),
    new DispatcherEntry(["parsing/references/references-2C-ttl"], "GET", "/static/shapetrees/parsing/references-2C", null),
    new DispatcherEntry(["parsing/references/references-2C2-ttl"], "GET", "/static/shapetrees/parsing/references-2C2", null),
    new DispatcherEntry(["parsing/mixed/mixed-1-ttl"], "GET", "/static/shapetrees/parsing/mixed-1", null),
    new DispatcherEntry(["parsing/mixed/mixed-2-ttl"], "GET", "/static/shapetrees/parsing/mixed-2", null),
    new DispatcherEntry(["parsing/mixed/mixed-2A-ttl"], "GET", "/static/shapetrees/parsing/mixed-2A", null),
    new DispatcherEntry(["parsing/mixed/mixed-2B-ttl"], "GET", "/static/shapetrees/parsing/mixed-2B", null),
    new DispatcherEntry(["parsing/mixed/mixed-2C-ttl"], "GET", "/static/shapetrees/parsing/mixed-2C", null),
    new DispatcherEntry(["parsing/mixed/mixed-2C2-ttl"], "GET", "/static/shapetrees/parsing/mixed-2C2", null),
    new DispatcherEntry(["parsing/mixed/mixed-2D-ttl"], "GET", "/static/shapetrees/parsing/mixed-2D", null),
    new DispatcherEntry(["parsing/cycle-ttl"], "GET", "/static/shapetrees/parsing/cycle", null),
    new DispatcherEntry(["http/404"], "GET", "/static/shapetrees/invalid/shapetree-missing", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

beforeEach(() => {
    ShapeTreeFactory.clearCache();
    ShapeTreeResource.clearCache();
});

// parseShapeTreeReuse
test("Reuse previously cached shapetree", async () => {
  let projectShapeTree1: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree#ProjectTree"));
  expect(projectShapeTree1).not.toBeNull();
  let projectShapeTree2: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree#ProjectTree"));
  expect(projectShapeTree2).not.toBeNull();
  // assertEquals(projectShapeTree1.hashCode(), projectShapeTree2.hashCode()); // TODO: operator=()
  // The "business" shape tree won't be in the cache, but it cross-contains pm:MilestoneTree, which should be.
  let businessShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/business/shapetree#BusinessTree"));
  expect(businessShapeTree).not.toBeNull();
});

// ensureCacheWithRecursion
test("Ensure reuse within recursion", async () => {
  // Retrieve the MilestoneTree shapetree (which is referred to by the ProjectTree shapetree)
  let milestoneShapeTree1: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-virtual#MilestoneTree"));
  expect(milestoneShapeTree1).not.toBeNull();
  // Retrieve the ProjectTree shapetree which will recursively cache the MilestoneTree shapetree
  let projectShapeTree1: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-virtual#ProjectTree"));
  expect(projectShapeTree1).not.toBeNull();
  // Retrieve the MilestoneTree shapetree again, ensuring the same instance is used
  let milestoneShapeTree2: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-virtual#MilestoneTree"));
  expect(milestoneShapeTree2).not.toBeNull();
  // assertEquals(milestoneShapeTree1.hashCode(), milestoneShapeTree2.hashCode()); // TODO: operator=
});

// parseShapeTreeReferences
test("Parse Tree with references", async () => {
  let projectShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-virtual#ProjectTree"));
  expect(projectShapeTree).not.toBeNull();
  expect(projectShapeTree.getReferences().length === 0).toEqual(false);
});

// parseShapeTreeContains
test("Parse Tree with contains", async () => {
  let projectShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree#ProjectTree"));
  expect(projectShapeTree).not.toBeNull();
  expect(projectShapeTree.getContains().map(u => u.href).indexOf("/static/shapetrees/project/shapetree#MilestoneTree") === -1).toEqual(true);
});

// parseShapeTreeContainsReservedTypes
test("Parse Tree that allows reserved resource types", async () => {
  let reservedShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/reserved/shapetree#EverythingTree"));
  expect(reservedShapeTree).not.toBeNull();
  expect(reservedShapeTree.getContains().map(u => u.href).indexOf("http://www.w3.org/ns/shapetrees#ResourceTree") !== -1).toEqual(true);
  expect(reservedShapeTree.getContains().map(u => u.href).indexOf("http://www.w3.org/ns/shapetrees#NonRDFResourceTree") !== -1).toEqual(true);
  expect(reservedShapeTree.getContains().map(u => u.href).indexOf("http://www.w3.org/ns/shapetrees#ContainerTree") !== -1).toEqual(true);
});

// // testTraverseReferences
// test("Traverse References", async () => {
//   let projectShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-virtual#ProjectTree"));
//   projectShapeTree.getReferencedShapeTrees();
//   expect(projectShapeTree.getReferencedShapeTrees(RecursionMethods.BREADTH_FIRST).hasNext()).toEqual(true);
//   expect(projectShapeTree.getReferencedShapeTrees(RecursionMethods.DEPTH_FIRST).hasNext()).toEqual(true);
// });

// failToParseMissingExpectsType
test("Fail to parse shape tree with missing expectsType", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/missing-expects-type#DataRepositoryTree"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToParseBadExpectsTypeOnContains
test("Fail to parse shape tree with st:contains but expects a non-container resource", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/contains-with-bad-expects-type#DataRepositoryTree"))).rejects.toBeInstanceOf(ShapeTreeException);
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/contains-with-nonrdf-expects-type#DataRepositoryTree"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToParseBadObjectTypeOnContains
test("Fail to parse shape tree with invalid object type", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/bad-object-type#DataRepositoryTree"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToParseMissingShapeTree
test("Fail to parse missing shape tree", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/shapetree-missing#missing"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToParseShapeTreeWithInvalidContentType
test("Fail to parse shape tree with invalid content type", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/project/shapetree-bad-content-type#bad"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToParseInvalidContainsObjects
test("Fail to parse shape tree with invalid contains objects", async () => {
  await expect(async () => await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/invalid/shapetree-invalid-contains-objects#DataRepositoryTree"))).rejects.toBeInstanceOf(ShapeTreeException);
});

// parseContainsAcrossMultipleDocuments
test("Parse st:contains across multiple documents", async () => {
  // Parse for recursive st:contains (use contains across multiple documents)
  let containsShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/parsing/contains-1#1ATree"));
  // Check the shape tree cache to ensure every contains shape tree was visited, parsed, and cached
  expect(11).toEqual(ShapeTreeFactory.getLocalShapeTreeCache().size);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-1#1ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2#2ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2#2BTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2#2CTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2A#2A1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2A#2A2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2B#2B1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C#2C1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C#2C2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C#2C3Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C2#2C21Tree").href);
  // Check the resource cache to ensure every visited resource was cached
  expect(6).toEqual(ShapeTreeResource.getLocalResourceCache().size);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-1").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-2A").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-2B").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/contains-2C").href);
});

// parseReferencesAcrossMultipleDocuments
test("Parse st:references across multiple documents", async () => {
  // Parse for recursive st:references (use references across multiple documents)
  let referencesShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/parsing/references-1#1ATree"));
  // Check the shape tree cache to ensure every referenced shape tree was visited, parsed, and cached
  expect(11).toEqual(ShapeTreeFactory.getLocalShapeTreeCache().size);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-1#1ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2#2ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2#2BTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2#2CTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2A#2A1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2A#2A2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2B#2B1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2C#2C1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2C#2C2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2C#2C3Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/references-2C2#2C21Tree").href);
  // Check the resource cache to ensure every visited resource was cached
  expect(6).toEqual(ShapeTreeResource.getLocalResourceCache().size);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-1").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-2A").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-2B").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-2C2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/references-2C").href);
});

// parseContainsAndReferencesAcrossMultipleDocuments
test("Parse st:contains and st:references across multiple documents", async () => {
  // Parse for mix of st:contains and references
  let referencesShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/parsing/mixed-1#1ATree"));
  // Check the shape tree cache to ensure every referenced shape tree was visited, parsed, and cached
  expect(13).toEqual(ShapeTreeFactory.getLocalShapeTreeCache().size);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-1#1ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2BTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2CTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2DTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2A#2A1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2A#2A2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2B#2B1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C3Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C2#2C21Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2D#2D1Tree").href);
  // Check the resource cache to ensure every visited resource was cached
  expect(7).toEqual(ShapeTreeResource.getLocalResourceCache().size);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-1").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2A").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2B").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C2").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C").href);
  ShapeTreeResource.getLocalResourceCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2D").href);
});

// parseWithCircularReference
test("Parse shape tree hierarchy with circular reference", async () => {
  // Ensure the parser correctly handles circular references
  let circularShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/parsing/cycle#1ATree"));
  expect(12).toEqual(ShapeTreeFactory.getLocalShapeTreeCache().size);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-1#1ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2ATree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2BTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2CTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2#2DTree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2A#2A1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2A#2A2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2B#2B1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C1Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C2Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2C#2C3Tree").href);
  ShapeTreeFactory.getLocalShapeTreeCache().has(server.urlFor("/static/shapetrees/parsing/mixed-2D#2D1Tree").href);
});
