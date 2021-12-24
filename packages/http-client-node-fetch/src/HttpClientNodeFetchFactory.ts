// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp
import { HttpClientFactory } from '@shapetrees/client-http/src/HttpClientFactory';
import { HttpRequest } from '@shapetrees/client-http/src/HttpRequest';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/ExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpClientNodeFetch } from './HttpClientNodeFetch';

/**
 * The ShapeTree library uses a generic interface (`HttpClient`) to execute HTTP queries on the POD and for external documents.
 * The HttpClientNodeFetch uses the java.net.http library to implement `HttpClient`.
 * This factory generates variations of java.net.http those clients depending on the need for SSL validation and ShapeTree validation.
 */
export class HttpClientNodeFetchFactory implements HttpClientFactory, ExternalDocumentLoader {

   useSslValidation: boolean;

  /**
   * Construct a factory for JsHttpClients
   *
   * @param useSslValidation
   */
  constructor(useSslValidation: boolean) {
    this.useSslValidation = useSslValidation;
  }

  /**
   * Create a new java.net.http HttpClient.
   * This fulfils the HttpClientFactory interface, so this factory can be use in
   *   HttpClientFactoryManager.setFactory(new HttpClientNodeFetchFactory(...));
   *
   * @param useShapeTreeValidation
   * @return a new or existing java.net.http HttpClient
   * @throws ShapeTreeException if the HttpClientNodeFetch constructor threw one
   */
  public get(useShapeTreeValidation: boolean): HttpClientNodeFetch /* throws ShapeTreeException */ {
    try {
      return new HttpClientNodeFetch(this.useSslValidation, useShapeTreeValidation);
    } catch (ex: any) {
       throw new ShapeTreeException(500, ex.message);
     }
  }

  /**
   * Load a non-POD document
   * This fulfils the ExternalDocumentLoader interface, so this factory can be use in
   *   DocumentLoaderManager.setLoader(new HttpClientNodeFetchFactory(...));
   *
   * @param resourceUrl URL of resource to be retrieved
   * @return a DocumentResponse with the results of a successful GET
   * @throws ShapeTreeException if the GET was not successful
   */
  public async loadExternalDocument(resourceUrl: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
      const fetcher = this.get(false);
      let response: DocumentResponse = await fetcher.fetchShapeTreeResponse(new HttpRequest("GET", resourceUrl, null, null, null));
    if (response.getStatusCode() != 200) {
      throw new ShapeTreeException(500, "Failed to load contents of document: " + resourceUrl);
    }
    return response;
  }
}
