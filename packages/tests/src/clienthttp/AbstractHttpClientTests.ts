// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpClientFactory } from '@shapetrees/client-http/src/HttpClientFactory';
import { HttpShapeTreeClient } from '@shapetrees/client-http/src/HttpShapeTreeClient';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import { DispatchEntryServer } from '../fixtures/DispatchEntryServer';

export abstract class AbstractHttpClientTests {

  protected server = new DispatchEntryServer();
  protected context = new ShapeTreeContext(null);
  protected factory: HttpClientFactory = null!; // handled in beforeAll
  protected shapeTreeClient: HttpShapeTreeClient = new HttpShapeTreeClient();
  protected fetcher: HttpClient = null!; // handled in beforeAll
  protected static TEXT_TURTLE: string = "text/turtle";

  public constructor() {
    this.context = new ShapeTreeContext(null);
  }

  protected skipShapeTreeValidation(b: boolean): void {
    try {
      this.fetcher = this.factory.get(!b);
    } catch (e) {
      if (e instanceof ShapeTreeException) {
        throw new Error('skipShapeTreeValidation ShapeTreeException ' + e);
      } else {
        throw e;
      }
    }
  }
}
