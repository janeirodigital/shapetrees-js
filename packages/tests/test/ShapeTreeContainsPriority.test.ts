// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeFactory } from '@shapetrees/core/src/ShapeTreeFactory';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTree } from '@shapetrees/core/src/ShapeTree';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["shapetrees/contains-priority-shapetree-ttl"], "GET", "/static/shapetrees/contains-priority/shapetree", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

// testContainsPriorityOrderOfAllTreeTypes
test("Validate prioritized retrieval of all shape tree types", async () => {
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/contains-priority/shapetree#ContainsAllTypesTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(3).toEqual(prioritizedContains.length);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#LabelShapeTypeTree").href).toEqual(prioritizedContains[0].href);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#LabelTypeTree").href).toEqual(prioritizedContains[1].href);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#TypeOnlyTree").href).toEqual(prioritizedContains[2].href);
});

// testContainsPriorityOrderOfShapeTypeTrees
test("Validate prioritized retrieval of shape trees with shape and resource type validation", async () => {
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/contains-priority/shapetree#ContainsShapeTypeTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(2).toEqual(prioritizedContains.length);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#ShapeTypeTree")).toEqual(prioritizedContains[0]);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#TypeOnlyTree")).toEqual(prioritizedContains[1]);
});

// testContainsPriorityOrderOfLabelTypeTrees
test("Validate prioritized retrieval of shape tree trees with label and resource type validation", async () => {
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/contains-priority/shapetree#ContainsLabelTypeTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(2).toEqual(prioritizedContains.length);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#LabelTypeTree")).toEqual(prioritizedContains[0]);
  expect(server.urlFor("/static/shapetrees/contains-priority/shapetree#TypeOnlyTree")).toEqual(prioritizedContains[1]);
});
