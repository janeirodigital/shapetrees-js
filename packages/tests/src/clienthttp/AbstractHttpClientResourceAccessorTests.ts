// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpClientFactory } from '@shapetrees/client-http/src/HttpClientFactory';
import { HttpResourceAccessor } from '@shapetrees/client-http/src/HttpResourceAccessor';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { AbstractResourceAccessorTests } from '../AbstractResourceAccessorTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientResourceAccessorTests extends AbstractResourceAccessorTests {

   protected httpResourceAccessor: HttpResourceAccessor = null!; // handled in beforeAll
   protected fetcher: HttpClient = null!; // handled in beforeAll
   protected factory: HttpClientFactory = null!; // handled in beforeAll

  public constructor() {
    super();
    this.resourceAccessor = new HttpResourceAccessor();
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
