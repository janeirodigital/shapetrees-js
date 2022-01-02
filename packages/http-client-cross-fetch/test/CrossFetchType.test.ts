// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp;

import { HttpClientFactoryManager } from '@shapetrees/client-http/src/HttpClientFactoryManager';
import { AbstractHttpClientTypeTests } from '@shapetrees/tests/src/clienthttp/AbstractHttpClientTypeTests';
import {HttpClientCrossFetchFactory} from "../src/HttpClientCrossFetchFactory";
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { ExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/ExternalDocumentLoader';

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
