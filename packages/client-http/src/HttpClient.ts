// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.client.http
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpRequest } from './HttpRequest';

/**
 * abstract base class for ShapeTree library network drivers
 */
export interface HttpClient {

  /**
   * Execute an HTTP request to create a DocumentResponse object
   * Implements `HttpClient` interface
   * @param request an HTTP request with appropriate headers for ShapeTree interactions
   * @return new DocumentResponse with response headers and contents
   * @throws ShapeTreeException
   */
  fetchShapeTreeResponse(request: HttpRequest): Promise<DocumentResponse> /* throws ShapeTreeException */;
}
