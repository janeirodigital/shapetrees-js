// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeFactory } from '@shapetrees/core/src/ShapeTreeFactory';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTree } from '@shapetrees/core/src/ShapeTree';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { toUrl } from './fixtures/MockWebServerHelper/toUrl';

dispatcher: RequestMatchingFixtureDispatcher = null;
httpExternalDocumentLoader: HttpExternalDocumentLoader;

httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

beforeAll(() => {
  dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["shapetrees/contains-priority-shapetree-ttl"], "GET", "/static/shapetrees/contains-priority/shapetree", null)
  ]);
});

// testContainsPriorityOrderOfAllTreeTypes
test("Validate prioritized retrieval of all shape tree types", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/contains-priority/shapetree#ContainsAllTypesTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(3).toEqual(prioritizedContains.length);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#LabelShapeTypeTree")).toEqual(prioritizedContains[0]);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#LabelTypeTree")).toEqual(prioritizedContains[1]);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#TypeOnlyTree")).toEqual(prioritizedContains[2]);
});

// testContainsPriorityOrderOfShapeTypeTrees
test("Validate prioritized retrieval of shape trees with shape and resource type validation", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/contains-priority/shapetree#ContainsShapeTypeTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(2).toEqual(prioritizedContains.length);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#ShapeTypeTree")).toEqual(prioritizedContains[0]);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#TypeOnlyTree")).toEqual(prioritizedContains[1]);
});

// testContainsPriorityOrderOfLabelTypeTrees
test("Validate prioritized retrieval of shape tree trees with label and resource type validation", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let containingShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/contains-priority/shapetree#ContainsLabelTypeTree"));
  // Ensure the ordered result is correct
  let prioritizedContains: Array<URL> = await containingShapeTree.getPrioritizedContains();
  expect(2).toEqual(prioritizedContains.length);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#LabelTypeTree")).toEqual(prioritizedContains[0]);
  expect(toUrl(server, "/static/shapetrees/contains-priority/shapetree#TypeOnlyTree")).toEqual(prioritizedContains[1]);
});
