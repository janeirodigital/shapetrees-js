// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpClientFactory } from '@shapetrees/client-http/src/HttpClientFactory';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientInitializeTests {

  private factory: HttpClientFactory = null!; // handled in beforeAll

  runTests (driver: string) {
    describe(`AbstractHttpClientTypeTests using ${driver}`, () => {

// testNonValidatingHandler
test("ask HttpClientFactory for non-validating client", () => {
  let client: HttpClient = this.factory.get(false);
  expect(client).not.toBeNull();
});

// testValidatingHandler
test("ask HttpClientFactory for validating client", () => {
  let client: HttpClient = this.factory.get(true);
  expect(client).not.toBeNull();
});

    })
  }
}
