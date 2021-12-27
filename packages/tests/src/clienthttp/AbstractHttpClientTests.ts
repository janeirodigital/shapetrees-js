// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpClientFactory } from '@shapetrees/client-http/src/HttpClientFactory';
import { HttpShapeTreeClient } from '@shapetrees/client-http/src/HttpShapeTreeClient';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import { DispatchEntryServer } from '../fixtures/DispatchEntryServer';
import {Mockttp, getLocal} from "mockttp";

export abstract class AbstractHttpClientTests {

  protected factory: HttpClientFactory = null!; // handled in beforeAll
  protected shapeTreeClient: HttpShapeTreeClient = new HttpShapeTreeClient();
  protected readonly context: ShapeTreeContext;
  protected fetcher: HttpClient = null!; // handled in beforeAll
  protected static TEXT_TURTLE: string = "text/turtle";
  protected server: Mockttp = getLocal({ debug: false });

  public constructor() {
    this.context = new ShapeTreeContext(null);
  }

  beforeEach(() => this.server.start(8080));
  afterEach(() => this.server.stop());


    public toUrl(server: Mockttp, path: string): URL /* throws MalformedURLException */ {
    // TODO: duplicates com.janeirodigital.shapetrees.tests.fixtures.MockWebServerHelper.getURL;
    return new URL(server.urlFor(path).toString());
  }

  protected skipShapeTreeValidation(b: boolean): void {
    try {
      this.fetcher = this.factory.get(!b);
    } catch (e) {
      if (e instanceof ShapeTreeException) {
        throw new Error(e.toString());
      } else {
        throw e;
      }
    }
  }
}
