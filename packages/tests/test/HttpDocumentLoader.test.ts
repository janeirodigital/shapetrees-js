// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["shapetrees/validation-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/static/shex/missing", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

afterAll(() => {
  DocumentLoaderManager.setLoader(null);
});

// failToLoadMissingHttpDocument
test("Fail to load missing document over http", async () => {
  await expect(async () => {
    await httpExternalDocumentLoader.loadExternalDocument(server.urlFor("/static/shex/missing"));
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// loadHttpDocument
test("Successfully load shape tree document over http", async () => {
  let shapeTreeDocument: DocumentResponse = await httpExternalDocumentLoader.loadExternalDocument(server.urlFor("/static/shapetrees/validation/shapetree"));
  expect(shapeTreeDocument).not.toBeNull();
  expect(200).toEqual(shapeTreeDocument.getStatusCode());
  expect(shapeTreeDocument.isExists()).toEqual(true);
  expect(shapeTreeDocument.getBody()).not.toBeNull();
  expect(shapeTreeDocument.getResourceAttributes()).not.toBeNull();
});

// handleInterruptedThreadOnLoadHttpDocument
/*
test("Successfully handle thread interruption", async () => {
  Thread.currentThread().interrupt();
  await expect(async () => {
    let shapeTreeDocument: DocumentResponse = await httpExternalDocumentLoader.loadExternalDocument(server.getURL("/static/shapetrees/validation/shapetree"));
  }).rejects.toBeInstanceOf(ShapeTreeException);
});
*/
