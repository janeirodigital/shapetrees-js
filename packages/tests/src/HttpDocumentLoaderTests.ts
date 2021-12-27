// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';

dispatcher: RequestMatchingFixtureDispatcher = null;
httpExternalDocumentLoader: HttpExternalDocumentLoader;

httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

protected getURL(server: Mockttp, path: string): URL /* throws MalformedURLException */ {
  return new URL(server.urlFor(path).toString());
}

beforeAll(() => {
  dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["shapetrees/validation-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null),
    new DispatcherEntry(["http/404"], "GET", "/static/shex/missing", null)
  ]);
});

// @AfterAll
static clearDocumentManager(): void {
  DocumentLoaderManager.setLoader(null);
}

// failToLoadMissingHttpDocument
test("Fail to load missing document over http", () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  expect(async () => {
    await httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shex/missing"));
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// loadHttpDocument
test("Successfully load shape tree document over http", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let shapeTreeDocument: DocumentResponse = await httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shapetrees/validation/shapetree"));
  expect(shapeTreeDocument).not.toBeNull();
  expect(200).toEqual(shapeTreeDocument.getStatusCode());
  expect(shapeTreeDocument.isExists()).toEqual(true);
  expect(shapeTreeDocument.getBody()).not.toBeNull();
  expect(shapeTreeDocument.getResourceAttributes()).not.toBeNull();
});

// handleInterruptedThreadOnLoadHttpDocument
test("Successfully handle thread interruption", () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  Thread.currentThread().interrupt();
  expect(async () => {
    let shapeTreeDocument: DocumentResponse = await httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shapetrees/validation/shapetree"));
  }).rejects.toBeInstanceOf(ShapeTreeException);
});