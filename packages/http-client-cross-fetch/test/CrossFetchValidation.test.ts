// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp;

import { HttpClientFactoryManager } from '@shapetrees/client-http/src/HttpClientFactoryManager';
import { HttpClientCrossFetchFactory } from "../src/HttpClientCrossFetchFactory";
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { AbstractHttpClientValidationTests } from '@shapetrees/tests/src/clienthttp/AbstractHttpClientValidationTests';

class CrossFetchValidationTests extends AbstractHttpClientValidationTests {

    public constructor() {
        // Call AbstractHttpClientValidationTests constructor
        // Which in turn calls the AbstractValidation constructor
        super();

        const myFactory = new HttpClientCrossFetchFactory(false);
        this.factory = myFactory;
        HttpClientFactoryManager.setFactory(this.factory);
        DocumentLoaderManager.setLoader(myFactory);

        this.skipShapeTreeValidation(false);  // Get a CrossFetch from the HttpClientFactory set above
    }
}

const harness = new CrossFetchValidationTests();
beforeAll(() => { return harness.startServer(); });
afterAll(() => { return harness.stopServer(); });
harness.runTests("CrossFetch");
