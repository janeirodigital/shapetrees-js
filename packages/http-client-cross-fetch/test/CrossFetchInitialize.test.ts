// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp;

import { HttpClientFactoryManager } from '@shapetrees/client-http/src/HttpClientFactoryManager';
import { HttpClientCrossFetchFactory } from "../src/HttpClientCrossFetchFactory";
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { AbstractHttpClientTypeTests } from '@shapetrees/tests/src/clienthttp/AbstractHttpClientTypeTests';
import {HttpClientCrossFetch} from "../src/HttpClientCrossFetch";

class CrossFetchTypeTests extends AbstractHttpClientTypeTests {

    public constructor() {
        // Call AbstractHttpClientTypeTests constructor
        // Which in turn calls the AbstractType constructor
        super();

        const myFactory = new HttpClientCrossFetchFactory(false);
        this.factory = myFactory;
        HttpClientFactoryManager.setFactory(this.factory);
        DocumentLoaderManager.setLoader(myFactory);

        this.skipShapeTreeValidation(false);  // Get a CrossFetch from the HttpClientFactory set above
    }
}

const harness = new CrossFetchTypeTests();
beforeAll(() => { return harness.startServer(); });
afterAll(() => { return harness.stopServer(); });
harness.runTests("CrossFetch");

// testInsecureClientHandler
test("Get insecure client handler", () => {
  const client: HttpClientCrossFetch = new HttpClientCrossFetchFactory(false).get(true);
  expect(client).not.toBeNull();
});

// testReusingClientsDifferentConfigurations
test("Reusing clients -- different configurations", () => { // 
  const client1: HttpClientCrossFetch = new HttpClientCrossFetchFactory(true).get(true);
  const client2: HttpClientCrossFetch = new HttpClientCrossFetchFactory(false).get(true);

  expect(client1).not.toEqual(client2);
});
