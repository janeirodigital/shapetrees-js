// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';

class HttpDocumentLoaderTests {

   private static dispatcher: RequestMatchingFixtureDispatcher = null;

   private static httpExternalDocumentLoader: HttpExternalDocumentLoader;

  public constructor() {
    HttpDocumentLoaderTests.httpExternalDocumentLoader = new HttpExternalDocumentLoader();
    DocumentLoaderManager.setLoader(HttpDocumentLoaderTests.httpExternalDocumentLoader);
  }

  protected getURL(server: Mockttp, path: string): URL /* throws MalformedURLException */ {
    return new URL(server.urlFor(path).toString());
  }

  // @BeforeAll
  static beforeAll(): void {
    HttpDocumentLoaderTests.dispatcher = new RequestMatchingFixtureDispatcher([
      new DispatcherEntry(["shapetrees/validation-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null), 
      new DispatcherEntry(["http/404"], "GET", "/static/shex/missing", null)
    ]);
  }

  // @AfterAll
  static clearDocumentManager(): void {
    DocumentLoaderManager.setLoader(null);
  }

  // @Test, @DisplayName("Fail to load missing document over http")
  failToLoadMissingHttpDocument(): void {
    const server = getLocal({ debug: false });
    server.setDispatcher(HttpDocumentLoaderTests.dispatcher);
    expect(async () => {
      await HttpDocumentLoaderTests.httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shex/missing"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @SneakyThrows, @Test, @DisplayName("Successfully load shape tree document over http")
  async loadHttpDocument(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(HttpDocumentLoaderTests.dispatcher);
    let shapeTreeDocument: DocumentResponse = await HttpDocumentLoaderTests.httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shapetrees/validation/shapetree"));
    expect(shapeTreeDocument).not.toBeNull();
    expect(200).toEqual(shapeTreeDocument.getStatusCode());
    expect(shapeTreeDocument.isExists()).toEqual(true);
    expect(shapeTreeDocument.getBody()).not.toBeNull();
    expect(shapeTreeDocument.getResourceAttributes()).not.toBeNull();
  }

  // @SneakyThrows, @Test, @DisplayName("Successfully handle thread interruption")
  handleInterruptedThreadOnLoadHttpDocument(): void {
    const server = getLocal({ debug: false });
    server.setDispatcher(HttpDocumentLoaderTests.dispatcher);
    Thread.currentThread().interrupt();
    expect(async () => {
      let shapeTreeDocument: DocumentResponse = await HttpDocumentLoaderTests.httpExternalDocumentLoader.loadExternalDocument(this.getURL(server, "/static/shapetrees/validation/shapetree"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }
}
