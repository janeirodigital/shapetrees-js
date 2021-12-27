// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientInitializeTests extends AbstractHttpClientTests {

   private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClient constructor
    super();
  }

  // @Test, @SneakyThrows
  testNonValidatingHandler(): void {
    let client: HttpClient = this.factory.get(false);
    expect(client).not.toBeNull();
  }

  // @Test, @SneakyThrows
  testValidatingHandler(): void {
    let client: HttpClient = this.factory.get(true);
    expect(client).not.toBeNull();
  }
}
