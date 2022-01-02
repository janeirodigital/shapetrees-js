// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp;

import { HttpClientFactoryManager } from '@shapetrees/client-http/src/HttpClientFactoryManager';
import { AbstractHttpClientResourceAccessorTests } from '@shapetrees/tests/src/clienthttp/AbstractHttpClientResourceAccessorTests';
import {HttpClientCrossFetchFactory} from "../src/HttpClientCrossFetchFactory";

class CrossFetchResourceAccessorTests extends AbstractHttpClientResourceAccessorTests {

    public constructor() {
        // Call AbstractHttpClientResourceAccessorTests constructor
        // Which in turn calls the AbstractResourceAccessor constructor
        super();

        this.factory = new HttpClientCrossFetchFactory(false);
        HttpClientFactoryManager.setFactory(this.factory);

        this.skipShapeTreeValidation(false);  // Get a CrossFetch from the HttpClientFactory set above
    }
}

const harness = new CrossFetchResourceAccessorTests();
beforeAll(() => { return harness.startServer(); });
afterAll(() => { return harness.stopServer(); });
harness.runTests("CrossFetch");
