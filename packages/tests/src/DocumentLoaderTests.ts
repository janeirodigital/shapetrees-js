// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { ExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/ExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DocumentLoaderTests {

  // @BeforeAll, @AfterAll
  static clearDocumentManager(): void {
    DocumentLoaderManager.setLoader(null);
  }

  // @Test, @Order(1), @DisplayName("Fail to get missing document loader"), @SneakyThrows
  failToGetMissingDocumentLoader(): void {
    expect(async () => {
      await DocumentLoaderManager.getLoader();
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @Test, @Order(2), @DisplayName("Get document loader"), @SneakyThrows
  getDocumentLoader(): void {
    DocumentLoaderManager.setLoader(new TestDocumentLoader());
    expect(DocumentLoaderManager.getLoader()).not.toBeNull();
  }
}

class TestDocumentLoader implements ExternalDocumentLoader {

  public async loadExternalDocument(resourceURL: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    return new DocumentResponse(null, null, 200);
  }
}
