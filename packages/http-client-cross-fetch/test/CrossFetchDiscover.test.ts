// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp;

import { HttpClientFactoryManager } from '@shapetrees/client-http/src/HttpClientFactoryManager';
import { HttpClientCrossFetchFactory } from "../src/HttpClientCrossFetchFactory";
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { AbstractHttpClientDiscoverTests } from '@shapetrees/tests/src/clienthttp/AbstractHttpClientDiscoverTests';

class CrossFetchDiscoverTests extends AbstractHttpClientDiscoverTests {

    public constructor() {
        // Call AbstractHttpClientDiscoverTests constructor
        // Which in turn calls the AbstractDiscover constructor
        super();

        const myFactory = new HttpClientCrossFetchFactory(false);
        this.factory = myFactory;
        HttpClientFactoryManager.setFactory(this.factory);
        DocumentLoaderManager.setLoader(myFactory);

        this.skipShapeTreeValidation(false);  // Get a CrossFetch from the HttpClientFactory set above
    }
}

const harness = new CrossFetchDiscoverTests();
beforeAll(() => { return harness.startServer(); });
afterAll(() => { return harness.stopServer(); });
harness.runTests("CrossFetch");
