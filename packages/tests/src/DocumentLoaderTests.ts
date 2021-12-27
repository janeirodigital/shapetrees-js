// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { ExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/ExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';

beforeAll(() => {
  DocumentLoaderManager.setLoader(null);
});

// failToGetMissingDocumentLoader
test("Fail to get missing document loader", () => {
  expect(async () => {
    await DocumentLoaderManager.getLoader();
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// getDocumentLoader
test("Get document loader", () => {
  DocumentLoaderManager.setLoader(new TestDocumentLoader());
  expect(DocumentLoaderManager.getLoader()).not.toBeNull();
});
}

class TestDocumentLoader implements ExternalDocumentLoader {

  public async loadExternalDocument(resourceURL: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    return new DocumentResponse(null, null, 200);
  }
}
